/**
 * Dashboard API
 * Handles all dashboard-related API calls
 */

import apiClient from "../apiClient";

export const dashboardApi = {
  /**
   * Get dashboard statistics
   * @returns {Promise<DashboardStats>}
   */
  getStats: () => apiClient.get("/dashboard/stats"),
};

// ==================== Types (for reference) ====================
/**
 * @typedef {Object} DashboardStats
 * @property {number} totalFloors
 * @property {number} totalRooms
 * @property {number} totalBeds
 * @property {number} occupiedBeds
 * @property {number} availableBeds
 * @property {number} activeTenants
 * @property {number} monthlyRevenue
 * @property {number} totalRevenue
 * @property {number} pendingDues
 * @property {number} occupancyRate
 * @property {boolean} isDevMode
 */
