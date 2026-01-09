/**
 * Beds API
 * Handles all bed-related API calls
 */

import apiClient from "../apiClient";

export const bedsApi = {
  /**
   * Get all beds
   * @param {Object} [params] - Query parameters
   * @param {string} [params.floorId] - Filter by floor ID
   * @param {string} [params.roomId] - Filter by room ID
   * @param {string} [params.status] - Filter by status (AVAILABLE, OCCUPIED)
   * @returns {Promise<Bed[]>}
   */
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/beds?${queryString}` : "/beds";
    return apiClient.get(endpoint);
  },

  /**
   * Get a single bed by ID
   * @param {string} id - Bed ID
   * @returns {Promise<Bed>}
   */
  getById: (id) => apiClient.get(`/beds/${id}`),

  /**
   * Get available beds
   * @returns {Promise<Bed[]>}
   */
  getAvailable: () => apiClient.get("/beds?status=AVAILABLE"),

  /**
   * Get beds by room ID
   * @param {string} roomId - Room ID
   * @returns {Promise<Bed[]>}
   */
  getByRoom: (roomId) => apiClient.get(`/beds?roomId=${roomId}`),

  /**
   * Get beds by floor ID
   * @param {string} floorId - Floor ID
   * @returns {Promise<Bed[]>}
   */
  getByFloor: (floorId) => apiClient.get(`/beds?floorId=${floorId}`),
};

// ==================== Types (for reference) ====================
/**
 * @typedef {Object} Bed
 * @property {string} _id
 * @property {string} bedNumber
 * @property {string|Room} room
 * @property {string|Floor} floor
 * @property {string} status - AVAILABLE, OCCUPIED
 * @property {string|Tenant} [tenant]
 * @property {Object} gridPosition
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */
