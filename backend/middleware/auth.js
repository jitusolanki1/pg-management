/**
 * Authentication Middleware - Bank-Grade Security
 * JWT + Session validation with Dev Mode support
 */

import jwt from "jsonwebtoken";
import Session from "../models/Session.js";
import { decryptPayload } from "../utils/encryption.js";
import { getClientIP } from "./security.js";
import { isDevMode, getDevModels } from "../config/database.js";

const COMM_SECRET = process.env.COMM_SECRET;

export const authenticate = async (req, res, next) => {
  const ip = getClientIP(req);

  try {
    // 1. Extract authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const token = authHeader.split(" ")[1];
    const sessionToken = req.headers["x-session-token"];

    if (!sessionToken) {
      return res.status(401).json({ error: "Session token required" });
    }

    // 2. Verify JWT signature and expiration
    let decoded;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET ||
          "3a7f9b2e4c8d1e5f6a9b0c3d2e8f7a1b5c9d0e2f4a6b8c0d1e3f5a7b9c2d4e6",
        {
          algorithms: ["HS256"],
        }
      );
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        return res.status(401).json({
          error: "Session expired",
          code: "TOKEN_EXPIRED",
        });
      }
      return res.status(401).json({ error: "Invalid authentication token" });
    }

    // 3. Check if dev mode (use dev database)
    const isDev = isDevMode(decoded.phoneNumber);
    req.isDevMode = isDev;

    // 4. Validate session (use appropriate database)
    let sessionValidation;
    if (isDev) {
      const devModels = getDevModels();
      if (devModels && devModels.Session) {
        sessionValidation = await devModels.Session.validateSession(
          sessionToken,
          token
        );
      } else {
        // Fallback to main Session model
        sessionValidation = await Session.validateSession(sessionToken, token);
      }
    } else {
      sessionValidation = await Session.validateSession(sessionToken, token);
    }

    if (!sessionValidation.valid) {
      return res.status(401).json({
        error: "Session invalid or expired",
        code: "SESSION_INVALID",
      });
    }

    // 5. Decrypt request body if encrypted
    if (req.body && req.body._encrypted) {
      try {
        req.body = decryptPayload(req.body._encrypted, COMM_SECRET);
      } catch (decryptError) {
        return res.status(400).json({ error: "Invalid request format" });
      }
    }

    // 6. Attach admin info to request
    req.adminId = decoded.adminId;
    req.phoneNumber = decoded.phoneNumber;
    req.sessionToken = sessionToken;
    req.session = sessionValidation.session;

    // 7. Attach dev models if in dev mode
    if (isDev) {
      req.devModels = getDevModels();
    }

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({ error: "Authentication failed" });
  }
};
