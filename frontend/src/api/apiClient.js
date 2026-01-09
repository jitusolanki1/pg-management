/**
 * Base API Client
 * Centralized HTTP client with authentication handling
 */

import { generateNonce, clearSensitiveData } from "../utils/encryption";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

// Auth state
let authToken = null;
let sessionToken = null;
let tokenExpiry = null;
let refreshTimer = null;
let isDevMode = false;

// Listeners for auth state changes
const authListeners = new Set();

// ==================== Auth State Management ====================

export function onAuthChange(callback) {
  authListeners.add(callback);
  return () => authListeners.delete(callback);
}

function notifyAuthChange(isAuthenticated) {
  authListeners.forEach((callback) => callback(isAuthenticated));
}

export function setDevMode(isDev) {
  isDevMode = isDev;
  console.log(
    `🔧 Dev Mode: ${isDev ? "ON (pg_dev database)" : "OFF (pg database)"}`
  );
}

export function getDevMode() {
  return isDevMode;
}

export function setAuthTokens(token, session, expiry) {
  authToken = token;
  sessionToken = session;
  tokenExpiry = new Date(expiry);
  setupTokenRefresh();
  notifyAuthChange(true);
}

export function clearAuth() {
  authToken = null;
  sessionToken = null;
  tokenExpiry = null;
  isDevMode = false;

  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }

  clearSensitiveData();
  notifyAuthChange(false);
}

export function isAuthenticated() {
  if (!authToken || !sessionToken) return false;
  if (tokenExpiry && new Date() >= tokenExpiry) {
    clearAuth();
    return false;
  }
  return true;
}

export function getSessionTimeRemaining() {
  if (!tokenExpiry) return 0;
  const remaining = tokenExpiry.getTime() - Date.now();
  return Math.max(0, Math.floor(remaining / 1000));
}

// ==================== Token Refresh ====================

function setupTokenRefresh() {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
  }

  if (!tokenExpiry) return;

  // For dev mode, refresh 5 minutes before expiry
  // For production, refresh 2 minutes before expiry
  const refreshBuffer = isDevMode ? 5 * 60 * 1000 : 2 * 60 * 1000;
  const refreshTime = tokenExpiry.getTime() - Date.now() - refreshBuffer;

  if (refreshTime > 0) {
    refreshTimer = setTimeout(async () => {
      try {
        await refreshToken();
        console.log("🔄 Token refreshed successfully");
      } catch (error) {
        console.error("Token refresh failed:", error);
        // Don't logout immediately, try one more time
        setTimeout(async () => {
          try {
            await refreshToken();
            console.log("🔄 Token refreshed on retry");
          } catch (retryError) {
            console.error("Token refresh retry failed:", retryError);
            clearAuth();
          }
        }, 5000); // Retry after 5 seconds
      }
    }, refreshTime);
  } else if (tokenExpiry.getTime() > Date.now()) {
    // Token not expired yet but refresh time passed, refresh immediately
    refreshToken().catch((error) => {
      console.error("Immediate token refresh failed:", error);
    });
  }
}

async function refreshToken() {
  if (!authToken || !sessionToken) {
    throw new Error("No active session");
  }

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
      "X-Session-Token": sessionToken,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Token refresh failed");
  }

  const data = await response.json();

  if (data.success) {
    authToken = data.token;
    sessionToken = data.sessionToken;
    tokenExpiry = new Date(data.expiresAt);

    // Update dev mode from response
    if (data.isDevMode !== undefined) {
      isDevMode = data.isDevMode;
    }

    setupTokenRefresh();
    notifyAuthChange(true);
    return true;
  } else {
    throw new Error("Token refresh failed");
  }
}

// ==================== HTTP Request Handler ====================

/**
 * Make an authenticated HTTP request
 * @param {string} endpoint - API endpoint
 * @param {object} options - Request options
 * @returns {Promise<any>} Response data
 */
async function request(endpoint, options = {}) {
  const isAuthRoute = endpoint.startsWith("/auth/");

  // Check authentication for non-auth routes
  if (!isAuthRoute && !isAuthenticated()) {
    clearAuth();
    throw new Error("Session expired. Please login again.");
  }

  // Build headers
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (authToken && sessionToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
    headers["X-Session-Token"] = sessionToken;
  }

  headers["X-Request-Timestamp"] = Date.now().toString();
  headers["X-Request-Nonce"] = generateNonce();

  // Build URL
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${path}`;

  // Process body
  let body = options.body;
  if (body && typeof body === "string") {
    try {
      const parsed = JSON.parse(body);
      body = JSON.stringify(parsed);
    } catch (e) {
      console.warn("Request body is not valid JSON");
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      body,
    });

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error(
        `Backend returned ${response.status}: Expected JSON but got ${contentType}.`
      );
    }

    const data = await response.json();

    // Handle 401 errors
    if (response.status === 401) {
      const errorCode = data.code;
      if (errorCode === "TOKEN_EXPIRED" || errorCode === "SESSION_INVALID") {
        clearAuth();
        throw new Error("Session expired. Please login again.");
      }
      throw new Error(data.error || "Authentication failed");
    }

    if (!response.ok) {
      throw new Error(
        data.error || `Request failed with status ${response.status}`
      );
    }

    return data;
  } catch (error) {
    // Network error handling
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        `Cannot connect to backend at ${API_BASE_URL}. Please ensure the server is running.`
      );
    }
    throw error;
  }
}

// ==================== API Methods ====================

const apiClient = {
  get: (endpoint) => request(endpoint, { method: "GET" }),

  post: (endpoint, body) =>
    request(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  put: (endpoint, body) =>
    request(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  patch: (endpoint, body) =>
    request(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  delete: (endpoint) => request(endpoint, { method: "DELETE" }),
};

// ==================== Visibility Change Handler ====================

if (typeof document !== "undefined") {
  let hiddenTime = null;

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      hiddenTime = Date.now();
    } else if (hiddenTime) {
      const hiddenDuration = Date.now() - hiddenTime;
      // Validate session if hidden for more than 5 minutes
      if (hiddenDuration > 5 * 60 * 1000 && isAuthenticated()) {
        request("/auth/validate", { method: "GET" }).catch(() => {
          clearAuth();
        });
      }
      hiddenTime = null;
    }
  });
}

export default apiClient;
