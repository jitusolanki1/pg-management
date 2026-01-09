/**
 * Login Attempt Model
 * Tracks all authentication attempts for security monitoring
 */

import mongoose from "mongoose";

const loginAttemptSchema = new mongoose.Schema(
  {
    ip: {
      type: String,
      required: true,
      index: true,
    },
    phoneNumber: {
      type: String,
      index: true,
    },
    success: {
      type: Boolean,
      required: true,
    },
    stage: {
      type: String,
      enum: [
        "otp_request",
        "otp_verify",
        "token_validation",
        "dev_login",
        "admin_login",
        "google_admin_login",
        "qr_verify",
        "ip_blocked",
        "rate_limited",
        "session_check",
      ],
      required: true,
    },
    failureReason: {
      type: String,
    },
    // Device fingerprint
    deviceInfo: {
      userAgent: String,
      browser: String,
      os: String,
      device: String,
      isMobile: Boolean,
    },
    // Geolocation
    location: {
      country: String,
      region: String,
      city: String,
      latitude: Number,
      longitude: Number,
      timezone: String,
    },
    // Session tracking
    sessionToken: {
      type: String,
      index: true,
    },
    // Associated admin (if login successful)
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    timestamp: {
      type: Date,
      default: Date.now,
      // Note: TTL index defined separately
    },
  },
  { timestamps: true }
);

// Compound index for rate limiting queries
loginAttemptSchema.index({ ip: 1, timestamp: -1 });
loginAttemptSchema.index({ phoneNumber: 1, timestamp: -1 });

// Auto-delete old records after 90 days
loginAttemptSchema.index(
  { timestamp: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 }
);

// Static method to count recent attempts
loginAttemptSchema.statics.countRecentAttempts = async function (
  ip,
  minutes = 15
) {
  const since = new Date(Date.now() - minutes * 60 * 1000);
  return await this.countDocuments({
    ip,
    timestamp: { $gte: since },
  });
};

// Static method to count recent failed attempts
loginAttemptSchema.statics.countRecentFailures = async function (
  ip,
  minutes = 15
) {
  const since = new Date(Date.now() - minutes * 60 * 1000);
  return await this.countDocuments({
    ip,
    success: false,
    timestamp: { $gte: since },
  });
};

// Static method to get recent attempts for an IP
loginAttemptSchema.statics.getRecentAttempts = async function (ip, limit = 10) {
  return await this.find({ ip })
    .sort({ timestamp: -1 })
    .limit(limit)
    .select("-__v");
};

export default mongoose.model("LoginAttempt", loginAttemptSchema);
