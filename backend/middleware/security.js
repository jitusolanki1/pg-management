/**
 * Bank-Grade Security Middleware
 * Implements comprehensive security checks for all requests
 */

import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import BlockedIP from "../models/BlockedIP.js";
import LoginAttempt from "../models/LoginAttempt.js";
import Session from "../models/Session.js";
import { decryptPayload } from "../utils/encryption.js";
import geoip from "geoip-lite";
import useragent from "useragent";

// Communication secret for request/response encryption
const COMM_SECRET = process.env.COMM_SECRET;

/**
 * Extract real client IP (handles proxies)
 */
export function getClientIP(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    "unknown"
  );
}

/**
 * Parse user agent for device info
 */
export function parseUserAgent(ua) {
  const agent = useragent.parse(ua);
  return {
    browser: agent.toAgent(),
    os: agent.os.toString(),
    device: agent.device.toString(),
    isMobile: /mobile|android|iphone|ipad/i.test(ua),
  };
}

/**
 * Get geolocation from IP
 */
export function getGeoLocation(ip) {
  try {
    const geo = geoip.lookup(ip);
    if (geo) {
      return {
        country: geo.country,
        region: geo.region,
        city: geo.city,
        latitude: geo.ll?.[0],
        longitude: geo.ll?.[1],
        timezone: geo.timezone,
      };
    }
  } catch (error) {
    console.error("Geolocation error:", error.message);
  }
  return null;
}

/**
 * IP Blocking Middleware
 * Blocks requests from blacklisted IPs
 * Bypasses blocking for localhost in development
 */
export async function ipBlocker(req, res, next) {
  const ip = getClientIP(req);

  // Bypass IP blocking for localhost in development
  const isLocalhost =
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "::ffff:127.0.0.1" ||
    ip === "localhost";
  const isDev = process.env.NODE_ENV !== "production";

  if (isLocalhost && isDev) {
    return next();
  }

  try {
    const isBlocked = await BlockedIP.isBlocked(ip);

    if (isBlocked) {
      // Log blocked attempt
      await LoginAttempt.create({
        ip,
        success: false,
        stage: "ip_blocked",
        failureReason: "IP is blocked",
        deviceInfo: parseUserAgent(req.headers["user-agent"]),
        location: getGeoLocation(ip),
      });

      // Don't reveal that IP is blocked - return generic error
      return res.status(403).json({
        error: "Access denied. Please try again later.",
      });
    }

    next();
  } catch (error) {
    console.error("IP blocker error:", error);
    next(); // Allow request on error to prevent DOS
  }
}

/**
 * Rate Limiter for OTP requests
 * Max 3 OTP requests per 15 minutes per IP
 */
export const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,
  keyGenerator: (req) => {
    return getClientIP(req) || "unknown";
  },
  validate: { xForwardedForHeader: false },
  handler: async (req, res) => {
    const ip = getClientIP(req);

    // Auto-block after rate limit exceeded
    await BlockedIP.blockIP(
      ip,
      "OTP rate limit exceeded",
      {
        attackType: "rate_limit",
        userAgent: req.headers["user-agent"],
      },
      60 * 60 * 1000
    ); // Block for 1 hour

    res.status(429).json({
      error: "Too many requests. Please try again later.",
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate Limiter for login verification
 * Max 5 verification attempts per 15 minutes per IP
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => {
    return getClientIP(req) || "unknown";
  },
  validate: { xForwardedForHeader: false },
  handler: async (req, res) => {
    const ip = getClientIP(req);

    await BlockedIP.blockIP(
      ip,
      "Login rate limit exceeded",
      {
        attackType: "brute_force",
        userAgent: req.headers["user-agent"],
      },
      2 * 60 * 60 * 1000
    ); // Block for 2 hours

    res.status(429).json({
      error: "Too many failed attempts. Please try again later.",
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  keyGenerator: (req) => {
    return getClientIP(req) || "unknown";
  },
  validate: { xForwardedForHeader: false },
  handler: (req, res) => {
    res.status(429).json({
      error: "Rate limit exceeded. Please slow down.",
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export async function authenticate(req, res, next) {
  const ip = getClientIP(req);

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const token = authHeader.split(" ")[1];
    const sessionToken = req.headers["x-session-token"];

    if (!sessionToken) {
      return res.status(401).json({ error: "Session token required" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ["HS256"],
        issuer: "pg-management",
        audience: "pg-admin",
      });
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ error: "Session expired. Please login again." });
      }
      return res.status(401).json({ error: "Invalid authentication token" });
    }

    const sessionValidation = await Session.validateSession(
      sessionToken,
      token
    );
    if (!sessionValidation.valid) {
      return res.status(401).json({
        error: "Session invalid or expired. Please login again.",
      });
    }

    // 4. Verify IP matches session IP (optional - enable for stricter security)
    // if (sessionValidation.session.ip !== ip) {
    //   await Session.revokeSession(sessionToken, "ip_mismatch")
    //   return res.status(401).json({ error: "Session security violation" })
    // }

    // 5. Decrypt request body if encrypted
    if (req.body && req.body._encrypted) {
      try {
        req.body = decryptPayload(req.body._encrypted, COMM_SECRET);
      } catch (decryptError) {
        return res.status(400).json({ error: "Invalid request format" });
      }
    }

    // 6. Attach admin info to request
    req.adminId = decoded.id;
    req.sessionToken = sessionToken;
    req.session = sessionValidation.session;

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({ error: "Authentication failed" });
  }
}

/**
 * Replay Attack Prevention
 * Validates request timestamp and nonce
 */
const usedNonces = new Set();
const NONCE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export function replayPrevention(req, res, next) {
  const timestamp = req.headers["x-request-timestamp"];
  const nonce = req.headers["x-request-nonce"];

  // Skip for non-sensitive endpoints
  if (!timestamp || !nonce) {
    return next();
  }

  const requestTime = parseInt(timestamp, 10);
  const now = Date.now();

  // Check if request is within acceptable time window
  if (Math.abs(now - requestTime) > NONCE_EXPIRY) {
    return res.status(400).json({ error: "Request expired" });
  }

  // Check if nonce was already used
  if (usedNonces.has(nonce)) {
    return res.status(400).json({ error: "Duplicate request" });
  }

  // Store nonce
  usedNonces.add(nonce);

  // Clean up old nonces periodically
  setTimeout(() => usedNonces.delete(nonce), NONCE_EXPIRY);

  next();
}

/**
 * Log all authentication attempts
 */
export async function logAttempt(
  ip,
  phoneNumber,
  success,
  stage,
  failureReason = null,
  adminId = null,
  sessionToken = null,
  req = null
) {
  try {
    await LoginAttempt.create({
      ip,
      phoneNumber,
      success,
      stage,
      failureReason,
      admin: adminId,
      sessionToken,
      deviceInfo: req ? parseUserAgent(req.headers["user-agent"]) : null,
      location: getGeoLocation(ip),
    });
  } catch (error) {
    console.error("Failed to log attempt:", error.message);
  }
}

/**
 * Auto-block on suspicious activity
 */
export async function checkSuspiciousActivity(ip) {
  try {
    const recentFailures = await LoginAttempt.countRecentFailures(ip, 15);

    // Block if more than 5 failures in 15 minutes
    if (recentFailures >= 5) {
      await BlockedIP.blockIP(
        ip,
        "Multiple failed login attempts",
        {
          attackType: "brute_force",
        },
        30 * 60 * 1000
      ); // 30 minutes

      return true;
    }

    return false;
  } catch (error) {
    console.error("Suspicious activity check error:", error);
    return false;
  }
}

export default {
  ipBlocker,
  otpRateLimiter,
  loginRateLimiter,
  apiRateLimiter,
  authenticate,
  replayPrevention,
  logAttempt,
  checkSuspiciousActivity,
  getClientIP,
  parseUserAgent,
  getGeoLocation,
};
