/**
 * Bank-Grade Authentication Routes
 * OTP-only authentication with Firebase Phone Auth
 * Supports Development Mode with separate database
 */

import express from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import dotenv from "dotenv";
import multer from "multer";
import { Jimp } from "jimp";
import jsQR from "jsqr";

// Ensure env is loaded
dotenv.config();

import Admin from "../models/Admin.js";
import Session from "../models/Session.js";
import BlockedIP from "../models/BlockedIP.js";
import LoginAttempt from "../models/LoginAttempt.js";
import { verifyFirebaseToken } from "../config/firebase.js";
import {
  sendLoginAlert,
  sendSuspiciousActivityAlert,
} from "../services/emailService.js";
import {
  ipBlocker,
  otpRateLimiter,
  loginRateLimiter,
  getClientIP,
  parseUserAgent,
  getGeoLocation,
  logAttempt,
  checkSuspiciousActivity,
} from "../middleware/security.js";
import { encrypt, decrypt, encryptPayload } from "../utils/encryption.js";
import { getDevConnection, isDevMode } from "../config/database.js";

const router = express.Router();

// Communication secret
const COMM_SECRET = process.env.COMM_SECRET || "pg-secure-comm-key-2024";

// JWT configuration
const JWT_SECRET =
  process.env.JWT_SECRET ||
  "3a7f9b2e4c8d1e5f6a9b0c3d2e8f7a1b5c9d0e2f4a6b8c0d1e3f5a7b9c2d4e6";
const JWT_EXPIRES_IN = process.env.NODE_ENV === "production" ? "30m" : "7d"; // 30 min for prod, 7 days for dev

/**
 * Step 1: Request OTP
 * POST /api/auth/request-otp
 * Body: { phoneNumber: "+917073829447" }
 *
 * Note: Actual OTP sending is handled by Firebase client SDK
 * This endpoint validates if the phone is authorized
 */
router.post(
  "/request-otp",
  ipBlocker,
  otpRateLimiter,
  async (req, res, next) => {
    const ip = getClientIP(req);

    try {
      const { phoneNumber } = req.body;

      if (!phoneNumber) {
        await logAttempt(
          ip,
          null,
          false,
          "otp_request",
          "Missing phone number",
          null,
          null,
          req
        );
        return res.status(400).json({ error: "Phone number is required" });
      }

      // Normalize phone number
      const normalized = phoneNumber
        .replace(/\s+/g, "")
        .replace(/^(\+91)?/, "+91");

      // Check if phone is authorized
      const isAuthorized = await Admin.isAuthorizedPhone(normalized);

      if (!isAuthorized) {
        await logAttempt(
          ip,
          normalized,
          false,
          "otp_request",
          "Unauthorized phone",
          null,
          null,
          req
        );

        // Check for suspicious activity
        const blocked = await checkSuspiciousActivity(ip);
        if (blocked) {
          const location = getGeoLocation(ip);
          await sendSuspiciousActivityAlert(
            { email: process.env.ADMIN_EMAIL },
            {
              ip,
              type: "Unauthorized Access Attempt",
              details: `Attempted login with unauthorized phone: ${normalized}`,
              timestamp: new Date(),
            }
          );
        }

        // Generic error to prevent phone enumeration
        return res.status(400).json({
          error: "Unable to process request. Please contact administrator.",
        });
      }

      // Log successful authorization check
      await logAttempt(
        ip,
        normalized,
        true,
        "otp_request",
        null,
        null,
        null,
        req
      );

      // Check if development mode (specific admin phone)
      const devPhone = process.env.DEV_PHONE || "+917073829447";
      const isDevMode = normalized === devPhone;

      // Return success - frontend will use Firebase to send OTP
      res.json({
        success: true,
        message: "Phone authorized. Proceed with OTP verification.",
        devMode: isDevMode,
      });
    } catch (error) {
      console.error("OTP request error:", error);
      next(error);
    }
  }
);

/**
 * Development Login (Password-based for testing)
 * POST /api/auth/dev-login
 * Body: { phoneNumber: "+917073829447", password: "Admin@123" }
 * Note: No IP blocking for dev login - it's for development only
 */
router.post("/dev-login", async (req, res, next) => {
  const ip = getClientIP(req);
  const userAgent = req.headers["user-agent"];
  const deviceInfo = parseUserAgent(userAgent);

  try {
    const { phoneNumber, password } = req.body;

    if (!phoneNumber || !password) {
      return res
        .status(400)
        .json({ error: "Phone number and password required" });
    }

    // Normalize phone number
    const normalized = phoneNumber
      .replace(/\s+/g, "")
      .replace(/^(\+91)?/, "+91");

    // Check if development phone
    const devPhone = process.env.DEV_PHONE || "+917073829447";
    const devPassword = process.env.DEV_PASSWORD || "Admin@123";

    if (normalized !== devPhone) {
      await logAttempt(
        ip,
        normalized,
        false,
        "dev_login",
        "Not dev phone",
        null,
        null,
        req
      );
      return res
        .status(401)
        .json({ error: "Development login not allowed for this phone" });
    }

    // Verify password
    if (password !== devPassword) {
      await logAttempt(
        ip,
        normalized,
        false,
        "dev_login",
        "Invalid password",
        null,
        null,
        req
      );
      return res.status(401).json({ error: "Invalid password" });
    }

    // Get development database connection
    const devConnection = getDevConnection();

    // Get or create models for dev database
    let DevAdmin, DevSession;
    if (devConnection) {
      DevAdmin =
        devConnection.models.Admin ||
        devConnection.model("Admin", Admin.schema);
      DevSession =
        devConnection.models.Session ||
        devConnection.model("Session", Session.schema);
    } else {
      // Fallback to main models if dev connection not ready
      DevAdmin = Admin;
      DevSession = Session;
    }

    // Find or create admin in DEV database
    let admin = await DevAdmin.findOne({ phoneNumber: normalized });

    if (!admin) {
      // Create admin on first login
      admin = new DevAdmin({
        phoneNumber: normalized,
        name: "Dev Admin",
        email: process.env.ADMIN_EMAIL || "admin@pgmanagement.com",
        isActive: true,
      });
      await admin.save();
      console.log("✅ Dev Admin created in DEV database:", normalized);
    }

    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const tokenId = crypto.randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days for dev

    // Generate JWT first (needed for tokenHash)
    const token = jwt.sign(
      {
        adminId: admin._id.toString(),
        tokenId,
        phoneNumber: admin.phoneNumber,
        isDevMode: true, // Mark as dev mode
      },
      JWT_SECRET,
      { expiresIn: "7d" } // Always 7 days for dev login
    );

    // Create session in DEV database
    const session = new DevSession({
      admin: admin._id,
      sessionToken,
      tokenHash: crypto.createHash("sha256").update(token).digest("hex"),
      ip,
      userAgent,
      deviceInfo,
      expiresAt,
      isActive: true,
    });
    await session.save();

    // Update admin last login
    admin.lastLogin = new Date();
    admin.lastIP = ip;
    await admin.save();

    // Log successful login
    await logAttempt(
      ip,
      normalized,
      true,
      "dev_login",
      null,
      admin._id,
      null,
      req
    );

    console.log(`✅ Dev login successful (DEV DATABASE): ${normalized}`);

    res.json({
      success: true,
      token,
      sessionToken,
      expiresAt: expiresAt.toISOString(),
      isDevMode: true,
      admin: {
        id: admin._id,
        name: admin.name,
        phoneNumber: admin.phoneNumber,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error("Dev login error:", error);
    next(error);
  }
});

/**
 * Admin Login (Email + Password) - Development Mode Only
 * POST /api/auth/admin-login
 * Body: { email: "admin@example.com", password: "Admin@123" }
 */
router.post("/admin-login", async (req, res, next) => {
  const ip = getClientIP(req);
  const userAgent = req.headers["user-agent"];
  const deviceInfo = parseUserAgent(userAgent);

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    // Check admin email from env
    const adminEmail = process.env.ADMIN_EMAIL || "js7073829447@gmail.com";
    const devPassword = process.env.DEV_PASSWORD || "Admin@123";
    const adminPhone = process.env.ADMIN_PHONE || "+917073829447";

    // In production, this endpoint is disabled
    if (process.env.NODE_ENV === "production") {
      return res
        .status(403)
        .json({ error: "This login method is disabled in production" });
    }

    // Verify email matches admin email
    if (email.toLowerCase() !== adminEmail.toLowerCase()) {
      await logAttempt(
        ip,
        email,
        false,
        "admin_login",
        "Email not authorized",
        null,
        null,
        req
      );
      return res.status(401).json({ error: "Unauthorized email" });
    }

    // Verify password
    if (password !== devPassword) {
      await logAttempt(
        ip,
        email,
        false,
        "admin_login",
        "Invalid password",
        null,
        null,
        req
      );
      return res.status(401).json({ error: "Invalid password" });
    }

    // Get development database connection
    const devConnection = getDevConnection();

    // Get or create models for dev database
    let DevAdmin, DevSession;
    if (devConnection) {
      DevAdmin =
        devConnection.models.Admin ||
        devConnection.model("Admin", Admin.schema);
      DevSession =
        devConnection.models.Session ||
        devConnection.model("Session", Session.schema);
    } else {
      DevAdmin = Admin;
      DevSession = Session;
    }

    // Find or create admin in DEV database
    let admin = await DevAdmin.findOne({
      $or: [
        { email: { $regex: new RegExp(`^${email}$`, "i") } },
        { phoneNumber: adminPhone },
      ],
    });

    if (!admin) {
      // Create admin on first login
      admin = new DevAdmin({
        phoneNumber: adminPhone,
        name: "Admin",
        email: adminEmail,
        isActive: true,
      });
      await admin.save();
      console.log("✅ Admin created in DEV database:", email);
    }

    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const tokenId = crypto.randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Generate JWT
    const token = jwt.sign(
      {
        adminId: admin._id.toString(),
        tokenId,
        email: admin.email,
        isDevMode: true,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Create session in DEV database
    const session = new DevSession({
      admin: admin._id,
      sessionToken,
      tokenHash: crypto.createHash("sha256").update(token).digest("hex"),
      ip,
      userAgent,
      deviceInfo,
      expiresAt,
      isActive: true,
    });
    await session.save();

    // Update admin last login
    admin.lastLogin = new Date();
    admin.lastIP = ip;
    await admin.save();

    // Log successful login
    await logAttempt(
      ip,
      email,
      true,
      "admin_login",
      null,
      admin._id,
      null,
      req
    );

    console.log(`✅ Admin login successful (DEV): ${email}`);

    res.json({
      success: true,
      token,
      sessionToken,
      expiresAt: expiresAt.toISOString(),
      isDevMode: true,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phoneNumber: admin.phoneNumber,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    next(error);
  }
});

/**
 * Google Admin Login - Production Mode
 * POST /api/auth/google-admin-login
 * Body: { idToken, email, uid }
 */
router.post("/google-admin-login", async (req, res, next) => {
  const ip = getClientIP(req);
  const userAgent = req.headers["user-agent"];
  const deviceInfo = parseUserAgent(userAgent);

  try {
    const { idToken, email, uid } = req.body;

    if (!idToken || !email) {
      return res.status(400).json({ error: "Google authentication required" });
    }

    // Check admin email from env
    const adminEmail = process.env.ADMIN_EMAIL || "js7073829447@gmail.com";
    const adminPhone = process.env.ADMIN_PHONE || "+917073829447";

    // Verify email matches admin email
    if (email.toLowerCase() !== adminEmail.toLowerCase()) {
      await logAttempt(
        ip,
        email,
        false,
        "google_admin_login",
        "Email not authorized",
        null,
        null,
        req
      );
      return res.status(401).json({ error: "Unauthorized Google account" });
    }

    // Verify Firebase ID token
    const firebaseResult = await verifyFirebaseToken(idToken);

    if (!firebaseResult.success) {
      await logAttempt(
        ip,
        email,
        false,
        "google_admin_login",
        "Invalid Google token",
        null,
        null,
        req
      );
      return res.status(401).json({ error: "Google verification failed" });
    }

    // Find or create admin
    let admin = await Admin.findOne({
      $or: [
        { email: { $regex: new RegExp(`^${email}$`, "i") } },
        { googleEmail: { $regex: new RegExp(`^${email}$`, "i") } },
        { phoneNumber: adminPhone },
      ],
    });

    if (!admin) {
      // Create admin on first Google login
      admin = new Admin({
        phoneNumber: adminPhone,
        name: firebaseResult.name || "Admin",
        email: adminEmail,
        googleEmail: email,
        firebaseUid: uid,
        isActive: true,
      });
      await admin.save();
      console.log("✅ Admin created via Google:", email);
    } else {
      // Update Google info
      admin.googleEmail = email;
      admin.firebaseUid = uid;
      await admin.save();
    }

    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const tokenId = crypto.randomBytes(16).toString("hex");
    const isProd = process.env.NODE_ENV === "production";
    const expiresAt = new Date(
      Date.now() + (isProd ? 30 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000)
    );

    // Generate JWT
    const token = jwt.sign(
      {
        adminId: admin._id.toString(),
        tokenId,
        email: admin.email,
        isDevMode: !isProd,
      },
      JWT_SECRET,
      { expiresIn: isProd ? "30m" : "7d" }
    );

    // Create session
    const session = new Session({
      admin: admin._id,
      sessionToken,
      tokenHash: crypto.createHash("sha256").update(token).digest("hex"),
      ip,
      userAgent,
      deviceInfo,
      expiresAt,
      isActive: true,
    });
    await session.save();

    // Update admin last login
    admin.lastLogin = new Date();
    admin.lastIP = ip;
    await admin.save();

    // Log successful login
    await logAttempt(
      ip,
      email,
      true,
      "google_admin_login",
      null,
      admin._id,
      null,
      req
    );

    console.log(`✅ Google admin login successful: ${email}`);

    res.json({
      success: true,
      token,
      sessionToken,
      expiresAt: expiresAt.toISOString(),
      isDevMode: !isProd,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phoneNumber: admin.phoneNumber,
      },
    });
  } catch (error) {
    console.error("Google admin login error:", error);
    next(error);
  }
});

/**
 * Step 2: Verify OTP & Login
 * POST /api/auth/verify-otp
 * Body: { firebaseToken: "...", phoneNumber: "+917073829447" }
 */
router.post(
  "/verify-otp",
  ipBlocker,
  loginRateLimiter,
  async (req, res, next) => {
    const ip = getClientIP(req);
    const userAgent = req.headers["user-agent"];
    const deviceInfo = parseUserAgent(userAgent);
    const location = getGeoLocation(ip);

    try {
      const { firebaseToken, phoneNumber } = req.body;

      if (!firebaseToken || !phoneNumber) {
        await logAttempt(
          ip,
          phoneNumber,
          false,
          "otp_verify",
          "Missing credentials",
          null,
          null,
          req
        );
        return res.status(400).json({ error: "Verification failed" });
      }

      // Normalize phone number
      const normalized = phoneNumber
        .replace(/\s+/g, "")
        .replace(/^(\+91)?/, "+91");

      // Verify Firebase token
      const firebaseResult = await verifyFirebaseToken(firebaseToken);

      if (!firebaseResult.success) {
        await logAttempt(
          ip,
          normalized,
          false,
          "otp_verify",
          `Firebase: ${firebaseResult.error}`,
          null,
          null,
          req
        );

        // Check for brute force
        await checkSuspiciousActivity(ip);

        return res.status(401).json({ error: "OTP verification failed" });
      }

      // Verify phone number matches
      if (firebaseResult.phone !== normalized) {
        await logAttempt(
          ip,
          normalized,
          false,
          "otp_verify",
          "Phone mismatch",
          null,
          null,
          req
        );
        return res.status(401).json({ error: "Verification failed" });
      }

      // Find or create admin
      let admin = await Admin.findByPhone(normalized);

      if (!admin) {
        // First-time login - create admin if phone is whitelisted
        const isAuthorized = await Admin.isAuthorizedPhone(normalized);

        if (!isAuthorized) {
          await logAttempt(
            ip,
            normalized,
            false,
            "otp_verify",
            "Unauthorized",
            null,
            null,
            req
          );
          return res.status(403).json({ error: "Access denied" });
        }

        // Create new admin
        admin = await Admin.create({
          phoneNumber: normalized,
          firebaseUid: firebaseResult.uid,
          name: "PG Admin",
          email: process.env.ADMIN_EMAIL || "admin@pg-management.com",
          role: "ADMIN",
          metadata: {
            createdBy: "auto_registration",
            registrationIP: ip,
          },
        });
      } else {
        // Update Firebase UID if not set
        if (!admin.firebaseUid) {
          admin.firebaseUid = firebaseResult.uid;
          await admin.save();
        }
      }

      // Generate JWT
      const jwtPayload = {
        id: admin._id,
        phone: normalized.slice(-4), // Last 4 digits only
        role: admin.role,
        iat: Math.floor(Date.now() / 1000),
      };

      const token = jwt.sign(jwtPayload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
        algorithm: "HS256",
        issuer: "pg-management",
        audience: "pg-admin",
      });

      // Create session
      const session = await Session.createSession(admin._id, token, {
        ip,
        userAgent,
        deviceInfo,
        location,
        firebaseUid: firebaseResult.uid,
      });

      // Record login
      await admin.recordLogin(ip, location, deviceInfo);

      // Log successful login
      await logAttempt(
        ip,
        normalized,
        true,
        "otp_verify",
        null,
        admin._id,
        session.sessionToken,
        req
      );

      // Send login alert email
      if (admin.notifications?.loginAlerts !== false) {
        sendLoginAlert(admin, {
          ip,
          location,
          deviceInfo,
          timestamp: new Date(),
        }).catch((err) => console.error("Login alert failed:", err));
      }

      // Calculate token expiry
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

      // Response
      res.json({
        success: true,
        token,
        sessionToken: session.sessionToken,
        expiresAt,
        admin: admin.toSafeObject(),
      });
    } catch (error) {
      console.error("OTP verification error:", error);
      await logAttempt(
        ip,
        req.body?.phoneNumber,
        false,
        "otp_verify",
        error.message,
        null,
        null,
        req
      );
      next(error);
    }
  }
);

/**
 * Refresh Token (within active session)
 * POST /api/auth/refresh
 * Supports both production and dev mode sessions
 */
router.post("/refresh", ipBlocker, async (req, res, next) => {
  const ip = getClientIP(req);

  try {
    const authHeader = req.headers.authorization;
    const sessionToken = req.headers["x-session-token"];

    if (!authHeader || !sessionToken) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const currentToken = authHeader.split(" ")[1];

    // Decode token to check if dev mode
    let decoded;
    try {
      decoded = jwt.verify(currentToken, JWT_SECRET, {
        ignoreExpiration: true,
      });
    } catch (err) {
      // Try to decode without verification for expired tokens
      decoded = jwt.decode(currentToken);
    }

    const isDevModeSession = decoded?.isDevMode === true;

    // Use appropriate database
    let SessionModel = Session;
    let AdminModel = Admin;

    if (isDevModeSession) {
      const devConnection = getDevConnection();
      if (devConnection) {
        SessionModel =
          devConnection.models.Session ||
          devConnection.model("Session", Session.schema);
        AdminModel =
          devConnection.models.Admin ||
          devConnection.model("Admin", Admin.schema);
      }
    }

    // Validate current session (even if token expired)
    const session = await SessionModel.findOne({
      sessionToken,
      isActive: true,
    }).populate("admin");

    if (!session) {
      return res
        .status(401)
        .json({ error: "Session expired. Please login again." });
    }

    // Verify token hash matches
    const tokenHash = crypto
      .createHash("sha256")
      .update(currentToken)
      .digest("hex");
    if (session.tokenHash !== tokenHash) {
      session.isActive = false;
      session.revokedAt = new Date();
      session.revokedReason = "token_mismatch";
      await session.save();
      return res.status(401).json({ error: "Session invalid" });
    }

    // Check session expiry - for dev mode, allow refresh anytime before actual expiry
    const now = new Date();

    if (now > session.expiresAt) {
      // Session actually expired
      session.isActive = false;
      session.revokedAt = new Date();
      session.revokedReason = "expired";
      await session.save();
      return res
        .status(401)
        .json({ error: "Session expired. Please login again." });
    }

    // For dev mode or if close to expiry, generate new token
    const expiryBuffer = new Date(session.expiresAt.getTime() - 5 * 60 * 1000);
    const shouldRefresh = isDevModeSession || now >= expiryBuffer;

    if (!shouldRefresh) {
      // Not close to expiry, return current token
      return res.json({
        success: true,
        token: currentToken,
        sessionToken,
        expiresAt: session.expiresAt.toISOString(),
        isDevMode: isDevModeSession,
      });
    }

    // Generate new token
    const tokenId = crypto.randomBytes(16).toString("hex");
    const newExpiresAt = new Date(
      Date.now() + (isDevModeSession ? 7 * 24 * 60 * 60 * 1000 : 30 * 60 * 1000)
    );

    const newToken = jwt.sign(
      {
        adminId: session.admin._id.toString(),
        tokenId,
        phoneNumber: session.admin.phoneNumber,
        isDevMode: isDevModeSession,
      },
      JWT_SECRET,
      { expiresIn: isDevModeSession ? "7d" : "30m" }
    );

    // Update session
    session.tokenHash = crypto
      .createHash("sha256")
      .update(newToken)
      .digest("hex");
    session.expiresAt = newExpiresAt;
    session.lastActivity = new Date();
    await session.save();

    console.log(
      `🔄 Token refreshed for ${isDevModeSession ? "DEV" : "PROD"} session`
    );

    res.json({
      success: true,
      token: newToken,
      sessionToken,
      expiresAt: newExpiresAt.toISOString(),
      isDevMode: isDevModeSession,
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    next(error);
  }
});

/**
 * Logout
 * POST /api/auth/logout
 * Supports both production and dev mode sessions
 */
router.post("/logout", ipBlocker, async (req, res, next) => {
  try {
    const sessionToken = req.headers["x-session-token"];
    const authHeader = req.headers.authorization;

    if (sessionToken) {
      // Check if dev mode session
      let isDevModeSession = false;
      if (authHeader) {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.decode(token);
        isDevModeSession = decoded?.isDevMode === true;
      }

      if (isDevModeSession) {
        // Revoke from dev database
        const devConnection = getDevConnection();
        if (devConnection) {
          const DevSession =
            devConnection.models.Session ||
            devConnection.model("Session", Session.schema);
          await DevSession.findOneAndUpdate(
            { sessionToken },
            {
              isActive: false,
              revokedAt: new Date(),
              revokedReason: "user_logout",
            }
          );
        }
      } else {
        await Session.revokeSession(sessionToken, "user_logout");
      }
    }

    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.json({ success: true });
  }
});

/**
 * Validate Session
 * GET /api/auth/validate
 * Supports both production and dev mode sessions
 */
router.get("/validate", ipBlocker, async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const sessionToken = req.headers["x-session-token"];

    if (!authHeader || !sessionToken) {
      return res.status(401).json({ valid: false });
    }

    const token = authHeader.split(" ")[1];
    let decoded;

    // Verify JWT - dev mode tokens don't have issuer/audience
    try {
      decoded = jwt.verify(token, JWT_SECRET, {
        algorithms: ["HS256"],
      });
    } catch (jwtError) {
      return res.status(401).json({ valid: false, reason: "token_expired" });
    }

    const isDevModeSession = decoded?.isDevMode === true;

    // Validate session
    if (isDevModeSession) {
      const devConnection = getDevConnection();
      if (devConnection) {
        const DevSession =
          devConnection.models.Session ||
          devConnection.model("Session", Session.schema);
        const session = await DevSession.findOne({
          sessionToken,
          isActive: true,
        });

        if (!session) {
          return res
            .status(401)
            .json({ valid: false, reason: "session_expired" });
        }

        // Verify token hash
        const tokenHash = crypto
          .createHash("sha256")
          .update(token)
          .digest("hex");
        if (session.tokenHash !== tokenHash) {
          return res
            .status(401)
            .json({ valid: false, reason: "token_mismatch" });
        }

        if (new Date() > session.expiresAt) {
          return res
            .status(401)
            .json({ valid: false, reason: "session_expired" });
        }

        return res.json({
          valid: true,
          expiresAt: session.expiresAt.toISOString(),
          isDevMode: true,
        });
      }
    }

    // Production session validation
    const validation = await Session.validateSession(sessionToken, token);

    if (!validation.valid) {
      return res.status(401).json({ valid: false, reason: validation.reason });
    }

    res.json({
      valid: true,
      expiresAt: validation.session.expiresAt.toISOString(),
      isDevMode: false,
    });
  } catch (error) {
    console.error("Validation error:", error);
    res.status(401).json({ valid: false });
  }
});

/**
 * Get Blocked IPs (Admin only)
 * GET /api/auth/blocked-ips
 */
router.get("/blocked-ips", ipBlocker, async (req, res, next) => {
  try {
    const blocked = await BlockedIP.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(blocked);
  } catch (error) {
    next(error);
  }
});

/**
 * Block an IP (Admin only)
 * POST /api/auth/block-ip
 */
router.post("/block-ip", ipBlocker, async (req, res, next) => {
  try {
    const { ip, reason, duration } = req.body;

    if (!ip || !reason) {
      return res.status(400).json({ error: "IP and reason required" });
    }

    const blocked = await BlockedIP.blockIP(
      ip,
      reason,
      {
        attackType: "manual",
      },
      duration || null
    );

    res.json({ success: true, blocked });
  } catch (error) {
    next(error);
  }
});

/**
 * Unblock an IP (Admin only)
 * POST /api/auth/unblock-ip
 */
router.post("/unblock-ip", ipBlocker, async (req, res, next) => {
  try {
    const { ip } = req.body;

    if (!ip) {
      return res.status(400).json({ error: "IP required" });
    }

    await BlockedIP.unblockIP(ip);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * Get Login History (Admin only)
 * GET /api/auth/login-history
 */
router.get("/login-history", ipBlocker, async (req, res, next) => {
  try {
    const history = await LoginAttempt.find()
      .sort({ timestamp: -1 })
      .limit(100)
      .select("-__v");

    res.json(history);
  } catch (error) {
    next(error);
  }
});

// Legacy routes (redirect to OTP flow)
router.post("/login", (req, res) => {
  res.status(410).json({
    error: "Password login is disabled. Please use OTP authentication.",
    redirect: "/login",
  });
});

router.post("/register", (req, res) => {
  res.status(410).json({
    error:
      "Registration is disabled. Admin accounts are created automatically on first OTP login.",
  });
});

/**
 * Production Admin QR Verification
 * POST /api/auth/verify-admin-qr
 * Body: FormData with qrImage, googleToken, googleEmail, googleUid
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images allowed"), false);
    }
  },
});

router.post(
  "/verify-admin-qr",
  upload.single("qrImage"),
  async (req, res, next) => {
    const ip = getClientIP(req);

    try {
      const { googleToken, googleEmail, googleUid } = req.body;
      const qrFile = req.file;

      console.log("📧 QR Verify - Received email:", googleEmail);
      console.log("📧 QR Verify - Expected email:", process.env.ADMIN_EMAIL);

      if (!googleEmail || !qrFile) {
        return res
          .status(400)
          .json({ error: "Google email and QR image required" });
      }

      // Verify admin email from env
      const adminEmail = process.env.ADMIN_EMAIL || "js7073829447@gmail.com";

      console.log(
        "📧 Comparing:",
        googleEmail.toLowerCase(),
        "===",
        adminEmail.toLowerCase()
      );

      if (googleEmail.toLowerCase() !== adminEmail.toLowerCase()) {
        console.log("❌ Email mismatch!");
        await logAttempt(
          ip,
          googleEmail,
          false,
          "qr_verify",
          "Unauthorized email",
          null,
          null,
          req
        );
        return res.status(401).json({ error: "Unauthorized email" });
      }

      // Decode QR from image
      let qrContent = null;
      try {
        const image = await Jimp.read(qrFile.buffer);
        const { data, width, height } = image.bitmap;

        // Convert to RGBA array
        const rgbaArray = new Uint8ClampedArray(data.length);
        for (let i = 0; i < data.length; i++) {
          rgbaArray[i] = data[i];
        }

        const qrCode = jsQR(rgbaArray, width, height);
        if (qrCode) {
          qrContent = qrCode.data;
        }
      } catch (err) {
        console.error("QR decode error:", err);
        return res
          .status(400)
          .json({ error: "Could not read QR code from image" });
      }

      if (!qrContent) {
        await logAttempt(
          ip,
          googleEmail,
          false,
          "qr_verify",
          "Invalid QR",
          null,
          null,
          req
        );
        return res.status(400).json({ error: "Could not read QR code" });
      }

      // Verify QR hash
      const qrHash = crypto
        .createHash("sha256")
        .update(qrContent)
        .digest("hex");
      const expectedHash = process.env.ADMIN_QR_HASH;

      if (!expectedHash) {
        console.error("ADMIN_QR_HASH not configured in environment");
        return res
          .status(500)
          .json({ error: "QR verification not configured" });
      }

      if (qrHash !== expectedHash) {
        await logAttempt(
          ip,
          googleEmail,
          false,
          "qr_verify",
          "QR hash mismatch",
          null,
          null,
          req
        );
        return res.status(401).json({ error: "Invalid QR code" });
      }

      // QR verified! Now create/find admin in PRODUCTION database
      let admin = await Admin.findOne({
        $or: [
          { email: { $regex: new RegExp(`^${googleEmail}$`, "i") } },
          { googleUid: googleUid },
        ],
      });

      if (!admin) {
        // Create admin on first production login
        admin = new Admin({
          phoneNumber: process.env.ADMIN_PHONE || "+917073829447",
          name: "Admin",
          email: adminEmail,
          googleUid: googleUid,
          isActive: true,
        });
        await admin.save();
        console.log("✅ Admin created in PRODUCTION database:", adminEmail);
      }

      // Generate session
      const sessionToken = crypto.randomBytes(32).toString("hex");
      const tokenId = crypto.randomBytes(16).toString("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours for production

      // Generate JWT
      const token = jwt.sign(
        {
          adminId: admin._id.toString(),
          tokenId,
          email: admin.email,
          isDevMode: false,
        },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      // Create session in PRODUCTION database
      const session = new Session({
        admin: admin._id,
        sessionToken,
        tokenHash: crypto.createHash("sha256").update(token).digest("hex"),
        ip,
        userAgent: req.headers["user-agent"],
        expiresAt,
        isActive: true,
      });
      await session.save();

      // Update admin last login
      admin.lastLogin = new Date();
      admin.lastIP = ip;
      await admin.save();

      // Log successful login
      await logAttempt(
        ip,
        googleEmail,
        true,
        "qr_verify",
        null,
        admin._id,
        null,
        req
      );

      console.log(`✅ Production admin login successful: ${googleEmail}`);

      res.json({
        success: true,
        token,
        sessionToken,
        expiresAt: expiresAt.toISOString(),
        isDevMode: false,
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          phoneNumber: admin.phoneNumber,
        },
      });
    } catch (error) {
      console.error("QR verification error:", error);
      next(error);
    }
  }
);

export default router;
