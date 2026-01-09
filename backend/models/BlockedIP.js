/**
 * IP Block Model
 * Tracks blocked IPs and login attempts
 */

import mongoose from "mongoose";

const blockedIPSchema = new mongoose.Schema(
  {
    ip: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
    },
    blockedAt: {
      type: Date,
      default: Date.now,
    },
    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    // Auto-unblock after duration (null = permanent)
    expiresAt: {
      type: Date,
      default: null,
    },
    // Attack details
    attemptCount: {
      type: Number,
      default: 1,
    },
    lastAttempt: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      userAgent: String,
      country: String,
      city: String,
      attackType: String, // 'brute_force', 'rate_limit', 'suspicious', 'manual'
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index for efficient lookup
blockedIPSchema.index({ isActive: 1, ip: 1 });
blockedIPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to check if IP is blocked
blockedIPSchema.statics.isBlocked = async function (ip) {
  const blocked = await this.findOne({
    ip,
    isActive: true,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  });
  return !!blocked;
};

// Static method to block an IP
blockedIPSchema.statics.blockIP = async function (
  ip,
  reason,
  metadata = {},
  duration = null
) {
  const expiresAt = duration ? new Date(Date.now() + duration) : null;

  return await this.findOneAndUpdate(
    { ip },
    {
      $set: {
        reason,
        isActive: true,
        expiresAt,
        metadata,
        lastAttempt: new Date(),
      },
      $inc: { attemptCount: 1 },
    },
    { upsert: true, new: true }
  );
};

// Static method to unblock an IP
blockedIPSchema.statics.unblockIP = async function (ip) {
  return await this.findOneAndUpdate(
    { ip },
    { $set: { isActive: false } },
    { new: true }
  );
};

export default mongoose.model("BlockedIP", blockedIPSchema);
