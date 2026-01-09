/**
 * API Client Exports
 * Central export point for all API modules
 */

// Base client with auth management
export { default as apiClient } from "./apiClient";
export {
  setAuthTokens,
  clearAuth,
  isAuthenticated,
  getSessionTimeRemaining,
  onAuthChange,
  setDevMode,
  getDevMode,
} from "./apiClient";

// Domain-specific APIs
export { authApi } from "./client/auth.api";
export { dashboardApi } from "./client/dashboard.api";
export { floorsApi } from "./client/floors.api";
export { roomsApi } from "./client/rooms.api";
export { bedsApi } from "./client/beds.api";
export { tenantsApi } from "./client/tenants.api";
export { paymentsApi } from "./client/payments.api";
export { plansApi } from "./client/plans.api";
