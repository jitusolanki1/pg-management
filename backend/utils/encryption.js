/**
 * Bank-Grade Encryption Utilities
 * AES-256-GCM encryption with unique keys per admin
 */

import crypto from "crypto";
import CryptoJS from "crypto-js";

// Master encryption key (should be in environment variable)
const MASTER_KEY = process.env.ENCRYPTION_KEY;
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;

/**
 * Generate a secure random key
 */
export function generateSecureKey() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Generate admin-specific encryption key from master key + adminId
 */
export function deriveAdminKey(adminId) {
  const salt = crypto.createHash("sha256").update(adminId.toString()).digest();
  return crypto.pbkdf2Sync(MASTER_KEY, salt, 100000, 32, "sha512");
}

/**
 * Encrypt data using AES-256-GCM
 * Returns: iv:authTag:encryptedData (base64 encoded)
 */
export function encrypt(plainText, adminId = null) {
  if (!plainText) return plainText;

  try {
    const key = adminId
      ? deriveAdminKey(adminId)
      : Buffer.from(MASTER_KEY, "hex");
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(JSON.stringify(plainText), "utf8", "base64");
    encrypted += cipher.final("base64");

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:encryptedData
    return `${iv.toString("base64")}:${authTag.toString(
      "base64"
    )}:${encrypted}`;
  } catch (error) {
    console.error("Encryption error:", error.message);
    throw new Error("Encryption failed");
  }
}

/**
 * Decrypt data using AES-256-GCM
 */
export function decrypt(encryptedText, adminId = null) {
  if (!encryptedText || typeof encryptedText !== "string") return encryptedText;

  // Check if it looks like encrypted data
  if (!encryptedText.includes(":")) return encryptedText;

  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 3) return encryptedText;

    const key = adminId
      ? deriveAdminKey(adminId)
      : Buffer.from(MASTER_KEY, "hex");
    const iv = Buffer.from(parts[0], "base64");
    const authTag = Buffer.from(parts[1], "base64");
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return JSON.parse(decrypted);
  } catch (error) {
    console.error("Decryption error:", error.message);
    return encryptedText; // Return original if decryption fails
  }
}

/**
 * Encrypt sensitive database fields
 */
export function encryptFields(data, fields, adminId) {
  if (!data || !fields || !adminId) return data;

  const encrypted = { ...data };
  for (const field of fields) {
    if (encrypted[field] !== undefined && encrypted[field] !== null) {
      encrypted[field] = encrypt(encrypted[field], adminId);
    }
  }
  return encrypted;
}

/**
 * Decrypt sensitive database fields
 */
export function decryptFields(data, fields, adminId) {
  if (!data || !fields || !adminId) return data;

  const decrypted = { ...data };
  for (const field of fields) {
    if (decrypted[field] !== undefined && decrypted[field] !== null) {
      decrypted[field] = decrypt(decrypted[field], adminId);
    }
  }
  return decrypted;
}

/**
 * Hash sensitive data (one-way, for comparison)
 */
export function hashData(data) {
  return crypto
    .createHash("sha256")
    .update(data + MASTER_KEY)
    .digest("hex");
}

/**
 * Decrypt request payload from frontend
 */
export function decryptPayload(encryptedPayload, secretKey) {
  try {
    if (!encryptedPayload) return null;

    const bytes = CryptoJS.AES.decrypt(encryptedPayload, secretKey);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);

    if (!decryptedString) {
      throw new Error("Decryption resulted in empty string");
    }

    return JSON.parse(decryptedString);
  } catch (error) {
    console.error("Payload decryption error:", error.message);
    throw new Error("Invalid encrypted payload");
  }
}

/**
 * Encrypt response payload for frontend
 */
export function encryptPayload(data, secretKey) {
  try {
    const jsonString = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonString, secretKey).toString();
  } catch (error) {
    console.error("Payload encryption error:", error.message);
    throw new Error("Response encryption failed");
  }
}

/**
 * Generate secure session token
 */
export function generateSessionToken() {
  return crypto.randomBytes(64).toString("hex");
}

/**
 * Generate secure OTP (6 digits)
 */
export function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

export default {
  encrypt,
  decrypt,
  encryptFields,
  decryptFields,
  hashData,
  decryptPayload,
  encryptPayload,
  generateSecureKey,
  generateSessionToken,
  generateOTP,
  deriveAdminKey,
};
