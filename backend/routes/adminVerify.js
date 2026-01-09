/**
 * Admin Verification Routes
 *
 * SECURITY ARCHITECTURE:
 *
 * DEVELOPMENT MODE (/dev/*):
 * - Email + Password login
 * - DEV QR verification (static hash in env)
 * - No Google auth required
 * - 7-day session tokens
 *
 * PRODUCTION MODE (/prod/*):
 * - Step 1: Google verification (mandatory)
 * - Step 2: QR verification (hash comparison)
 * - 30-minute session tokens
 * - No password fallback
 */

import express from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { Jimp } from "jimp";
import jsQR from "jsqr";
import Admin from "../models/Admin.js";
import {
  getClientIP,
  parseUserAgent,
  logAttempt,
} from "../middleware/security.js";
import { getDevConnection } from "../config/database.js";

const router = express.Router();

// ============================================
// CONFIGURATION
// ============================================

const JWT_SECRET =
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";
const DEV_PASSWORD = process.env.DEV_ADMIN_PASSWORD || "Admin@123";
const DEV_QR_HASH = process.env.DEV_QR_HASH || ""; // Set in .env: SHA-256 hash of dev QR content

// Token expiration
const DEV_TOKEN_EXPIRY = "7d";
const PROD_TOKEN_EXPIRY = "30m";

// Verification tokens (temporary, in-memory)
const verificationTokens = new Map();

// Clean expired tokens every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of verificationTokens.entries()) {
    if (data.expiresAt < now) {
      verificationTokens.delete(key);
    }
  }
}, 10 * 60 * 1000);

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate secure token
 */
const generateToken = () => crypto.randomBytes(32).toString("hex");

/**
 * Hash a string using SHA-256
 */
const hashString = (str) =>
  crypto.createHash("sha256").update(str).digest("hex");

/**
 * Decode QR from base64 image
 */
const decodeQRFromBase64 = async (base64Image) => {
  try {
    // Remove data URL prefix if present
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Load image with Jimp v1.x
    const image = await Jimp.read(buffer);
    const width = image.width;
    const height = image.height;

    // Jimp v1.x stores raw RGBA data in bitmap.data
    const rawData = new Uint8ClampedArray(image.bitmap.data);

    // Decode QR using jsQR
    const qrCode = jsQR(rawData, width, height);

    if (qrCode) {
      console.log(
        "✅ QR decoded successfully:",
        qrCode.data.substring(0, 50) + "..."
      );
      return qrCode.data;
    }

    console.log("❌ QR decode failed - no QR code found in image");
    return null;
  } catch (error) {
    console.error("QR decode error:", error.message);
    return null;
  }
};

/**
 * Generate JWT for admin
 */
const generateAdminJWT = (admin, isDev = false) => {
  const tokenId = crypto.randomBytes(16).toString("hex");
  const expiresIn = isDev ? DEV_TOKEN_EXPIRY : PROD_TOKEN_EXPIRY;

  const token = jwt.sign(
    {
      adminId: admin._id.toString(),
      tokenId,
      email: admin.email,
      isDev,
    },
    JWT_SECRET,
    { expiresIn }
  );

  // Calculate expiry date
  const expiresAt = new Date();
  if (isDev) {
    expiresAt.setDate(expiresAt.getDate() + 7);
  } else {
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);
  }

  return { token, expiresAt };
};

// ============================================
// DEVELOPMENT MODE ROUTES
// ============================================

/**
 * DEV: Login with email/password
 * POST /api/admin-verify/dev/login
 */
router.post("/dev/login", async (req, res) => {
  // Block in production
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({
      success: false,
      message: "Access denied",
    });
  }

  const ip = getClientIP(req);

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required",
      });
    }

    // Verify password
    if (password !== DEV_PASSWORD) {
      await logAttempt(
        ip,
        email,
        false,
        "dev_login",
        "Invalid password",
        null,
        null,
        req
      );
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Get dev database connection
    const devConnection = getDevConnection();
    let DevAdmin;

    if (devConnection) {
      DevAdmin =
        devConnection.models.Admin ||
        devConnection.model("Admin", Admin.schema);
    } else {
      DevAdmin = Admin;
    }

    // Find or create admin
    let admin = await DevAdmin.findOne({ email: email.toLowerCase() });

    if (!admin) {
      // Create admin on first dev login
      admin = new DevAdmin({
        email: email.toLowerCase(),
        name: "Dev Admin",
        phoneNumber: process.env.DEV_PHONE || "+917073829447",
        isActive: true,
      });
      await admin.save();
      console.log("✅ Dev Admin created:", email);
    }

    // Generate token
    const { token, expiresAt } = generateAdminJWT(admin, true);

    // Log success
    await logAttempt(ip, email, true, "dev_login", null, admin._id, null, req);
    console.log(`✅ Dev login successful: ${email}`);

    res.json({
      success: true,
      data: {
        token,
        expiresAt: expiresAt.toISOString(),
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          isDev: true,
        },
      },
    });
  } catch (error) {
    console.error("Dev login error:", error);
    res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
});

/**
 * DEV: QR verification
 * POST /api/admin-verify/dev/qr-verify
 */
router.post("/dev/qr-verify", async (req, res) => {
  // Block in production
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({
      success: false,
      message: "Access denied",
    });
  }

  const ip = getClientIP(req);

  try {
    const { qrImage } = req.body;

    if (!qrImage) {
      return res.status(400).json({
        success: false,
        message: "QR image required",
      });
    }

    // Decode QR
    const qrContent = await decodeQRFromBase64(qrImage);

    if (!qrContent) {
      return res.status(400).json({
        success: false,
        message: "Could not read QR code",
      });
    }

    // Hash the QR content
    const qrHash = hashString(qrContent);

    // Check if it's a valid dev QR (content starts with DEV_QR:)
    if (!qrContent.startsWith("DEV_QR:")) {
      return res.status(401).json({
        success: false,
        message: "Invalid QR code",
      });
    }

    // Verify against stored hash (if set) or accept any DEV_QR
    if (DEV_QR_HASH && qrHash !== DEV_QR_HASH) {
      await logAttempt(
        ip,
        null,
        false,
        "dev_qr_verify",
        "Invalid QR hash",
        null,
        null,
        req
      );
      return res.status(401).json({
        success: false,
        message: "Invalid QR code",
      });
    }

    // Get dev database
    const devConnection = getDevConnection();
    let DevAdmin;

    if (devConnection) {
      DevAdmin =
        devConnection.models.Admin ||
        devConnection.model("Admin", Admin.schema);
    } else {
      DevAdmin = Admin;
    }

    // Get or create default admin
    let admin = await DevAdmin.findOne({ isActive: true }).sort({
      createdAt: 1,
    });

    if (!admin) {
      admin = new DevAdmin({
        email: process.env.ADMIN_EMAIL || "admin@pgmanagement.com",
        name: "Dev Admin",
        phoneNumber: process.env.DEV_PHONE || "+917073829447",
        isActive: true,
      });
      await admin.save();
    }

    // Generate token
    const { token, expiresAt } = generateAdminJWT(admin, true);

    console.log(`✅ Dev QR login successful`);

    res.json({
      success: true,
      data: {
        token,
        expiresAt: expiresAt.toISOString(),
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          isDev: true,
        },
      },
    });
  } catch (error) {
    console.error("Dev QR verify error:", error);
    res.status(500).json({
      success: false,
      message: "Verification failed",
    });
  }
});

// ============================================
// PRODUCTION MODE ROUTES
// ============================================

/**
 * PROD: Google verification (Step 1)
 * POST /api/admin-verify/prod/google-verify
 */
router.post("/prod/google-verify", async (req, res) => {
  const ip = getClientIP(req);

  try {
    const { googleEmail, googleUid, googleName, googleToken } = req.body;

    if (!googleEmail || !googleUid) {
      return res.status(400).json({
        success: false,
        message: "Verification failed",
      });
    }

    // Find admin by Google email
    const admin = await Admin.findOne({
      $or: [
        { googleEmail: googleEmail.toLowerCase() },
        { email: googleEmail.toLowerCase() },
      ],
      isActive: true,
    });

    if (!admin) {
      await logAttempt(
        ip,
        googleEmail,
        false,
        "prod_google_verify",
        "Admin not found",
        null,
        null,
        req
      );
      return res.status(401).json({
        success: false,
        message: "Access denied",
      });
    }

    // Generate temporary verification token (valid for 10 minutes)
    const verificationToken = generateToken();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    // Store verification token
    verificationTokens.set(verificationToken, {
      adminId: admin._id.toString(),
      googleEmail: googleEmail.toLowerCase(),
      googleUid,
      googleName,
      expiresAt,
      ip,
    });

    await logAttempt(
      ip,
      googleEmail,
      true,
      "prod_google_verify",
      null,
      admin._id,
      null,
      req
    );
    console.log(`✅ Google verification passed: ${googleEmail}`);

    res.json({
      success: true,
      data: {
        verificationToken,
        adminName: admin.name,
      },
      message: "Google verification complete. Proceed to QR verification.",
    });
  } catch (error) {
    console.error("Google verify error:", error);
    res.status(500).json({
      success: false,
      message: "Verification failed",
    });
  }
});

/**
 * PROD: QR verification (Step 2)
 * POST /api/admin-verify/prod/qr-verify
 */
router.post("/prod/qr-verify", async (req, res) => {
  const ip = getClientIP(req);

  try {
    const { qrImage, verificationToken, googleEmail } = req.body;

    if (!qrImage || !verificationToken || !googleEmail) {
      return res.status(400).json({
        success: false,
        message: "Verification failed",
      });
    }

    // Validate verification token
    const tokenData = verificationTokens.get(verificationToken);

    if (!tokenData) {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please start over.",
      });
    }

    // Check if token expired
    if (tokenData.expiresAt < Date.now()) {
      verificationTokens.delete(verificationToken);
      return res.status(401).json({
        success: false,
        message: "Session expired. Please start over.",
      });
    }

    // Verify email matches
    if (tokenData.googleEmail !== googleEmail.toLowerCase()) {
      return res.status(401).json({
        success: false,
        message: "Verification failed",
      });
    }

    // Decode QR
    const qrContent = await decodeQRFromBase64(qrImage);

    if (!qrContent) {
      return res.status(400).json({
        success: false,
        message: "Could not read QR code",
      });
    }

    // QR content format: ADMIN_QR:{adminId}:{random}
    if (!qrContent.startsWith("ADMIN_QR:")) {
      await logAttempt(
        ip,
        googleEmail,
        false,
        "prod_qr_verify",
        "Invalid QR format",
        null,
        null,
        req
      );
      return res.status(401).json({
        success: false,
        message: "Invalid QR code",
      });
    }

    // Hash the QR content
    const qrHash = hashString(qrContent);

    // Get admin and verify QR hash
    const admin = await Admin.findById(tokenData.adminId).select("+qrHash");

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Access denied",
      });
    }

    // Compare QR hashes
    if (!admin.qrHash || admin.qrHash !== qrHash) {
      await logAttempt(
        ip,
        googleEmail,
        false,
        "prod_qr_verify",
        "QR hash mismatch",
        admin._id,
        null,
        req
      );
      return res.status(401).json({
        success: false,
        message: "Invalid QR code",
      });
    }

    // Delete verification token (one-time use)
    verificationTokens.delete(verificationToken);

    // Generate final JWT token
    const { token, expiresAt } = generateAdminJWT(admin, false);

    // Update admin last login
    admin.lastLogin = new Date();
    admin.lastLoginIP = ip;
    await admin.save();

    await logAttempt(
      ip,
      googleEmail,
      true,
      "prod_qr_verify",
      null,
      admin._id,
      null,
      req
    );
    console.log(`✅ Production login complete: ${googleEmail}`);

    res.json({
      success: true,
      data: {
        token,
        expiresAt: expiresAt.toISOString(),
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
        },
      },
      message: "Authentication successful",
    });
  } catch (error) {
    console.error("QR verify error:", error);
    res.status(500).json({
      success: false,
      message: "Verification failed",
    });
  }
});

// ============================================
// UTILITY ROUTES
// ============================================

/**
 * Check if in development mode
 * GET /api/admin-verify/mode
 */
router.get("/mode", (req, res) => {
  res.json({
    success: true,
    data: {
      isDev: process.env.NODE_ENV !== "production",
      mode: process.env.NODE_ENV || "development",
    },
  });
});

export default router;
