/**
 * Auth API
 * Handles all authentication-related API calls
 */

import apiClient from "../apiClient";

export const authApi = {
  /**
   * Request OTP for login
   * @param {string} phoneNumber - Phone number with country code
   * @returns {Promise<{success: boolean, message: string}>}
   */
  requestOtp: (phoneNumber) =>
    apiClient.post("/auth/request-otp", { phoneNumber }),

  /**
   * Verify OTP and login
   * @param {string} phoneNumber - Phone number
   * @param {string} otp - OTP code
   * @param {string} sessionId - Session ID from requestOtp
   * @returns {Promise<AuthResponse>}
   */
  verifyOtp: (phoneNumber, otp, sessionId) =>
    apiClient.post("/auth/verify-otp", { phoneNumber, otp, sessionId }),

  /**
   * Dev mode login with password
   * @param {string} phoneNumber - Phone number
   * @param {string} password - Password
   * @returns {Promise<AuthResponse>}
   */
  devLogin: (phoneNumber, password) =>
    apiClient.post("/auth/dev-login", { phoneNumber, password }),

  /**
   * Logout current session
   * @returns {Promise<{success: boolean, message: string}>}
   */
  logout: () => apiClient.post("/auth/logout"),

  /**
   * Validate current session
   * @returns {Promise<{valid: boolean}>}
   */
  validate: () => apiClient.get("/auth/validate"),

  /**
   * Refresh token
   * @returns {Promise<AuthResponse>}
   */
  refresh: () => apiClient.post("/auth/refresh"),
};

// ==================== Types (for reference) ====================
/**
 * @typedef {Object} AuthResponse
 * @property {boolean} success
 * @property {string} token
 * @property {string} sessionToken
 * @property {string} expiresAt
 * @property {Object} admin
 * @property {string} admin._id
 * @property {string} admin.phoneNumber
 * @property {boolean} [isDevMode]
 */
