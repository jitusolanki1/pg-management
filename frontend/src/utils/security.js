/**
 * Frontend Security Utilities
 * Implements request signing and protection
 */

// Anti-tampering: Check if DevTools is open
let devToolsOpen = false;

const checkDevTools = () => {
  const threshold = 160;
  const widthThreshold = window.outerWidth - window.innerWidth > threshold;
  const heightThreshold = window.outerHeight - window.innerHeight > threshold;

  if (widthThreshold || heightThreshold) {
    devToolsOpen = true;
  }
};

// Check periodically (only in production)
if (import.meta.env.PROD) {
  setInterval(checkDevTools, 1000);
}

/**
 * Generate request signature for API calls
 * Helps prevent request tampering
 */
export function generateRequestSignature(payload, timestamp) {
  // Simple signature using timestamp and payload hash
  const data = JSON.stringify(payload) + timestamp;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

/**
 * Generate secure nonce for requests
 */
export function generateNonce() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Check if running in secure context
 */
export function isSecureContext() {
  return (
    window.isSecureContext ||
    location.protocol === "https:" ||
    location.hostname === "localhost"
  );
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input) {
  if (typeof input !== "string") return input;
  return input
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .trim();
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone) {
  const cleaned = phone.replace(/\D/g, "");
  return /^[6-9]\d{9}$/.test(cleaned);
}

/**
 * Obfuscate sensitive data for logging
 */
export function obfuscateSensitiveData(data) {
  if (typeof data !== "object" || data === null) return data;

  const sensitiveFields = [
    "password",
    "token",
    "sessionToken",
    "otp",
    "aadhaar",
    "phone",
  ];
  const result = { ...data };

  for (const field of sensitiveFields) {
    if (result[field]) {
      result[field] = "***REDACTED***";
    }
  }

  return result;
}

/**
 * Prevent right-click context menu in production
 */
export function disableContextMenu() {
  if (import.meta.env.PROD) {
    document.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      return false;
    });
  }
}

/**
 * Prevent keyboard shortcuts for DevTools
 */
export function disableDevToolsShortcuts() {
  if (import.meta.env.PROD) {
    document.addEventListener("keydown", (e) => {
      // F12
      if (e.key === "F12") {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
      if (
        e.ctrlKey &&
        e.shiftKey &&
        ["I", "J", "C"].includes(e.key.toUpperCase())
      ) {
        e.preventDefault();
        return false;
      }
      // Ctrl+U (view source)
      if (e.ctrlKey && e.key.toUpperCase() === "U") {
        e.preventDefault();
        return false;
      }
    });
  }
}

/**
 * Initialize all security measures
 */
export function initializeSecurity() {
  if (import.meta.env.PROD) {
    disableContextMenu();
    disableDevToolsShortcuts();

    // Clear console in production
    console.clear();
    console.log(
      "%c⚠️ Security Warning",
      "color: red; font-size: 24px; font-weight: bold;"
    );
    console.log(
      "%cThis is a secure application. Do not paste any code here.",
      "color: red; font-size: 14px;"
    );
  }
}

export default {
  generateRequestSignature,
  generateNonce,
  isSecureContext,
  sanitizeInput,
  isValidPhoneNumber,
  obfuscateSensitiveData,
  initializeSecurity,
};
