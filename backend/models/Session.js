/**
 * Session Model
 * Tracks active admin sessions with enhanced security
 */

import mongoose from "mongoose";
import crypto from "crypto";

const sessionSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true,
    },
    // Unique session identifier
    sessionToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // Encrypted JWT token (not stored in plain text)
    tokenHash: {
      type: String,
      required: true,
    },
    // Session metadata
    ip: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
    },
    deviceInfo: {
      browser: String,
      os: String,
      device: String,
    },
    location: {
      country: String,
      city: String,
    },
    // Security flags
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    // Session expires after 30 minutes of inactivity
    expiresAt: {
      type: Date,
      required: true,
      // Note: TTL index defined separately
    },
    // Revocation tracking
    revokedAt: {
      type: Date,
    },
    revokedReason: {
      type: String,
    },
    // Firebase UID for token revocation
    firebaseUid: {
      type: String,
    },
  },
  { timestamps: true }
);

// TTL index - automatically delete expired sessions
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Generate session token
sessionSchema.statics.generateToken = function () {
  return crypto.randomBytes(64).toString("hex");
};

// Hash JWT for storage
sessionSchema.statics.hashToken = function (token) {
  return crypto.createHash("sha256").update(token).digest("hex");
};

// Create new session
sessionSchema.statics.createSession = async function (
  adminId,
  jwtToken,
  metadata
) {
  const sessionToken = this.generateToken();
  const tokenHash = this.hashToken(jwtToken);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

  // Invalidate any existing sessions for this admin (single session policy)
  await this.updateMany(
    { admin: adminId, isActive: true },
    {
      $set: {
        isActive: false,
        revokedAt: new Date(),
        revokedReason: "new_session_created",
      },
    }
  );

  return await this.create({
    admin: adminId,
    sessionToken,
    tokenHash,
    expiresAt,
    ...metadata,
  });
};

// Validate session
sessionSchema.statics.validateSession = async function (
  sessionToken,
  jwtToken
) {
  const session = await this.findOne({
    sessionToken,
    isActive: true,
    expiresAt: { $gt: new Date() },
  });

  if (!session) {
    return { valid: false, reason: "session_not_found" };
  }

  // Verify JWT hash matches
  const tokenHash = this.hashToken(jwtToken);
  if (session.tokenHash !== tokenHash) {
    return { valid: false, reason: "token_mismatch" };
  }

  // Update last activity
  session.lastActivity = new Date();
  await session.save();

  return { valid: true, session };
};

// Revoke session
sessionSchema.statics.revokeSession = async function (
  sessionToken,
  reason = "logout"
) {
  return await this.findOneAndUpdate(
    { sessionToken },
    {
      $set: {
        isActive: false,
        revokedAt: new Date(),
        revokedReason: reason,
      },
    },
    { new: true }
  );
};

// Revoke all sessions for admin
sessionSchema.statics.revokeAllSessions = async function (
  adminId,
  reason = "security"
) {
  return await this.updateMany(
    { admin: adminId, isActive: true },
    {
      $set: {
        isActive: false,
        revokedAt: new Date(),
        revokedReason: reason,
      },
    }
  );
};

export default mongoose.model("Session", sessionSchema);
