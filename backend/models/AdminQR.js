/**
 * Admin QR Code Model
 * Stores time-based QR codes for admin verification
 */

import mongoose from "mongoose";
import crypto from "crypto";

const adminQRSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },

    // Unique QR Code identifier
    code: {
      type: String,
      required: true,
      unique: true,
    },

    // IP address that generated the QR
    generatedFromIP: {
      type: String,
      required: true,
    },

    // IP address that scanned the QR (must match)
    scannedFromIP: {
      type: String,
    },

    // Device info
    userAgent: {
      type: String,
    },

    // Expiration (5 minutes from creation)
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 5 * 60 * 1000),
    },

    // Status
    status: {
      type: String,
      enum: ["pending", "scanned", "verified", "expired", "rejected"],
      default: "pending",
    },

    // Timestamps for actions
    scannedAt: {
      type: Date,
    },
    verifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// Note: 'code' already has unique: true which creates an index
adminQRSchema.index({ admin: 1 });
adminQRSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
adminQRSchema.index({ status: 1 });

// Static method to generate a unique code
adminQRSchema.statics.generateCode = function () {
  return crypto.randomBytes(32).toString("hex");
};

// Instance method to check if expired
adminQRSchema.methods.isExpired = function () {
  return new Date() > this.expiresAt;
};

// Instance method to verify IP match
adminQRSchema.methods.verifyIP = function (scanIP) {
  // Normalize IPs (handle IPv6 localhost vs IPv4)
  const normalizeIP = (ip) => {
    if (ip === "::1" || ip === "::ffff:127.0.0.1") return "127.0.0.1";
    if (ip && ip.startsWith("::ffff:")) return ip.substring(7);
    return ip;
  };

  const generatedIP = normalizeIP(this.generatedFromIP);
  const scannedIP = normalizeIP(scanIP);

  return generatedIP === scannedIP;
};

export default mongoose.model("AdminQR", adminQRSchema);
