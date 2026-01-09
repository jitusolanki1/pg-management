/**
 * Admin Model - Bank-Grade Security
 * OTP-only authentication, no passwords
 */

import mongoose from "mongoose";
import crypto from "crypto";

const adminSchema = new mongoose.Schema(
  {
    // Phone number is the primary identifier (required for OTP)
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // Firebase UID for token verification
    firebaseUid: {
      type: String,
      unique: true,
      sparse: true,
    },
    // Admin profile (encrypted sensitive fields)
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    // QR Hash for production verification (SHA-256 hash of QR payload)
    // Never store raw QR - only hash
    qrHash: {
      type: String,
      select: false, // Never return in queries by default
    },
    // Google email for production auth (must match Google Sign-In)
    googleEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    // Legacy fields (kept for migration, not used)
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    password: {
      type: String,
      select: false, // Never return password
    },
    // Role-based access (only ADMIN role)
    role: {
      type: String,
      enum: ["ADMIN"],
      default: "ADMIN",
    },
    // Encryption key unique to this admin
    encryptionKey: {
      type: String,
      default: () => crypto.randomBytes(32).toString("hex"),
    },
    // Security settings
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    lastLoginIP: {
      type: String,
    },
    // Track login history
    loginHistory: [
      {
        ip: String,
        timestamp: Date,
        location: {
          country: String,
          city: String,
        },
        deviceInfo: {
          browser: String,
          os: String,
        },
      },
    ],
    // Session management
    currentSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
    },
    // Notification preferences
    notifications: {
      loginAlerts: { type: Boolean, default: true },
      securityAlerts: { type: Boolean, default: true },
    },
    // Whitelisted phone numbers that can access (only this one admin)
    // Add more if needed
    metadata: {
      createdBy: String,
      registrationIP: String,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.encryptionKey;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Index for efficient queries
adminSchema.index({ phoneNumber: 1, isActive: 1 });
// Note: firebaseUid already has unique+sparse in schema definition

// Static: Find admin by phone number
adminSchema.statics.findByPhone = async function (phoneNumber) {
  // Normalize phone number
  const normalized = phoneNumber.replace(/\s+/g, "").replace(/^(\+91)?/, "+91");
  return await this.findOne({
    phoneNumber: normalized,
    isActive: true,
  });
};

// Static: Check if phone is authorized admin
adminSchema.statics.isAuthorizedPhone = async function (phoneNumber) {
  const normalized = phoneNumber.replace(/\s+/g, "").replace(/^(\+91)?/, "+91");

  // Check whitelist (hardcoded + database)
  const WHITELISTED_PHONES = [
    "+917073829447", // Primary admin phone
  ];

  if (WHITELISTED_PHONES.includes(normalized)) {
    return true;
  }

  // Check database
  const admin = await this.findOne({
    phoneNumber: normalized,
    isActive: true,
  });

  return !!admin;
};

// Method: Update login info
adminSchema.methods.recordLogin = async function (ip, location, deviceInfo) {
  this.lastLogin = new Date();
  this.lastLoginIP = ip;

  // Keep last 10 logins
  this.loginHistory = [
    { ip, timestamp: new Date(), location, deviceInfo },
    ...this.loginHistory.slice(0, 9),
  ];

  await this.save();
};

// Method: Get safe profile (no sensitive data)
adminSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phoneNumber:
      this.phoneNumber.slice(0, 6) + "****" + this.phoneNumber.slice(-2),
    role: this.role,
    lastLogin: this.lastLogin,
  };
};

export default mongoose.model("Admin", adminSchema);
