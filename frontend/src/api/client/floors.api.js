/**
 * Floors API
 * Handles all floor-related API calls
 */

import apiClient from "../apiClient";

export const floorsApi = {
  /**
   * Get all floors
   * @returns {Promise<Floor[]>}
   */
  getAll: () => apiClient.get("/floors"),

  /**
   * Get a single floor by ID
   * @param {string} id - Floor ID
   * @returns {Promise<Floor>}
   */
  getById: (id) => apiClient.get(`/floors/${id}`),

  /**
   * Create a new floor
   * @param {CreateFloorData} data - Floor data
   * @returns {Promise<Floor>}
   */
  create: (data) => apiClient.post("/floors", data),

  /**
   * Update a floor
   * @param {string} id - Floor ID
   * @param {UpdateFloorData} data - Floor data
   * @returns {Promise<Floor>}
   */
  update: (id, data) => apiClient.put(`/floors/${id}`, data),

  /**
   * Delete a floor
   * @param {string} id - Floor ID
   * @returns {Promise<{message: string}>}
   */
  delete: (id) => apiClient.delete(`/floors/${id}`),
};

// ==================== Types (for reference) ====================
/**
 * @typedef {Object} Floor
 * @property {string} _id
 * @property {number} floorNumber
 * @property {string} name
 * @property {number} totalRooms
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {Object} CreateFloorData
 * @property {number} floorNumber
 * @property {string} name
 */

/**
 * @typedef {Object} UpdateFloorData
 * @property {number} [floorNumber]
 * @property {string} [name]
 */
