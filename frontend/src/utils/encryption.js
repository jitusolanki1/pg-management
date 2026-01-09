/**
 * Client-Side Encryption Utilities
 * AES encryption for API requests
 */

import CryptoJS from "crypto-js";

// Communication secret (must match backend)
const COMM_SECRET = import.meta.env.VITE_COMM_SECRET;

/**
 * Encrypt data before sending to API
 */
export function encryptPayload(data) {
  if (!data) return null;

  try {
    const jsonString = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonString, COMM_SECRET).toString();
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypt data from API response
 */
export function decryptPayload(encryptedData) {
  if (!encryptedData) return null;

  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, COMM_SECRET);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);

    if (!decryptedString) {
      throw new Error("Decryption failed");
    }

    return JSON.parse(decryptedString);
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt data");
  }
}

/**
 * Generate unique nonce for replay prevention
 */
export function generateNonce() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

/**
 * Hash sensitive data (one-way)
 */
export function hashData(data) {
  return CryptoJS.SHA256(data).toString();
}

/**
 * Clear all sensitive data from memory
 */
export function clearSensitiveData() {
  // Clear any cached encryption data
  if (typeof window !== "undefined") {
    // Clear session storage (should be empty anyway)
    sessionStorage.clear();

    // Clear any in-memory caches
    if (window.confirmationResult) {
      window.confirmationResult = null;
    }
  }
}

export default {
  encryptPayload,
  decryptPayload,
  generateNonce,
  hashData,
  clearSensitiveData,
};
