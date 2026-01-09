/**
 * Admin Whitelist Model
 * Stores whitelisted IPs and admin devices
 */

import mongoose from "mongoose";

const adminWhitelistSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },

    // Whitelisted IP address
    ipAddress: {
      type: String,
      required: true,
    },

    // Description for this IP
    label: {
      type: String,
      trim: true,
      default: "Unknown Device",
    },

    // Device info when added
    userAgent: {
      type: String,
    },

    // Active status
    isActive: {
      type: Boolean,
      default: true,
    },

    // Last used
    lastUsedAt: {
      type: Date,
    },

    // Added by which admin
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique IP per admin
adminWhitelistSchema.index({ admin: 1, ipAddress: 1 }, { unique: true });
adminWhitelistSchema.index({ ipAddress: 1 });
adminWhitelistSchema.index({ isActive: 1 });

// Static method to check if IP is whitelisted
adminWhitelistSchema.statics.isIPWhitelisted = async function (
  adminId,
  ipAddress
) {
  // Normalize IP
  const normalizeIP = (ip) => {
    if (ip === "::1" || ip === "::ffff:127.0.0.1") return "127.0.0.1";
    if (ip && ip.startsWith("::ffff:")) return ip.substring(7);
    return ip;
  };

  const normalizedIP = normalizeIP(ipAddress);

  const entry = await this.findOne({
    admin: adminId,
    ipAddress: normalizedIP,
    isActive: true,
  });

  if (entry) {
    // Update last used
    entry.lastUsedAt = new Date();
    await entry.save();
    return true;
  }

  return false;
};

// Static method to check if any admin has this IP whitelisted
adminWhitelistSchema.statics.isIPWhitelistedGlobal = async function (
  ipAddress
) {
  const normalizeIP = (ip) => {
    if (ip === "::1" || ip === "::ffff:127.0.0.1") return "127.0.0.1";
    if (ip && ip.startsWith("::ffff:")) return ip.substring(7);
    return ip;
  };

  const normalizedIP = normalizeIP(ipAddress);

  // In development, always allow localhost
  if (process.env.NODE_ENV !== "production" && normalizedIP === "127.0.0.1") {
    return true;
  }

  const entry = await this.findOne({
    ipAddress: normalizedIP,
    isActive: true,
  });

  return !!entry;
};

export default mongoose.model("AdminWhitelist", adminWhitelistSchema);
