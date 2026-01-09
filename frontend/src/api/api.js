import {
  encryptPayload,
  generateNonce,
  clearSensitiveData,
} from "../utils/encryption";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

let authToken = null;
let sessionToken = null;
let tokenExpiry = null;
let refreshTimer = null;
let isDevMode = false;

const authListeners = new Set();

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

function setupTokenRefresh() {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
  }

  if (!tokenExpiry) return;

  const refreshTime = tokenExpiry.getTime() - Date.now() - 2 * 60 * 1000;

  if (refreshTime > 0) {
    refreshTimer = setTimeout(async () => {
      try {
        await refreshToken();
      } catch (error) {
        console.error("Token refresh failed:", error);
        clearAuth();
      }
    }, refreshTime);
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
    throw new Error("Token refresh failed");
  }

  const data = await response.json();

  if (data.success) {
    authToken = data.token;
    sessionToken = data.sessionToken;
    tokenExpiry = new Date(data.expiresAt);
    setupTokenRefresh();
  } else {
    throw new Error("Token refresh failed");
  }
}

async function request(endpoint, options = {}) {
  const isAuthRoute = endpoint.startsWith("/auth/");

  if (!isAuthRoute && !isAuthenticated()) {
    clearAuth();
    throw new Error("Session expired. Please login again.");
  }

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

  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${path}`;

  let body = options.body;
  if (body && typeof body === "string") {
    try {
      const parsed = JSON.parse(body);
      body = JSON.stringify(parsed);
    } catch (e) {
      console.warn("Request body is not valid JSON, skipping encryption");
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

    return { data, status: response.status };
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

const api = {
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

  delete: (endpoint) => request(endpoint, { method: "DELETE" }),

  setAuthTokens,
  clearAuth,
  isAuthenticated,
  getSessionTimeRemaining,
  onAuthChange,
  setDevMode,
  getDevMode,
};

if (typeof document !== "undefined") {
  let hiddenTime = null;

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      hiddenTime = Date.now();
    } else if (hiddenTime) {
      const hiddenDuration = Date.now() - hiddenTime;
      if (hiddenDuration > 5 * 60 * 1000 && isAuthenticated()) {
        request("/auth/validate", { method: "GET" }).catch(() => {
          clearAuth();
        });
      }
      hiddenTime = null;
    }
  });

  // Clear auth on page unload (optional - stricter security)
  // Uncomment for bank-grade "logout on tab close" behavior
  /*
  window.addEventListener("beforeunload", () => {
    clearAuth()
  })
  */
}

export default api;
