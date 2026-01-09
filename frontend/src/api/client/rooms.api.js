/**
 * Rooms API
 * Handles all room-related API calls
 */

import apiClient from "../apiClient";

export const roomsApi = {
  /**
   * Get all rooms
   * @param {Object} [params] - Query parameters
   * @param {string} [params.floorId] - Filter by floor ID
   * @returns {Promise<Room[]>}
   */
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/rooms?${queryString}` : "/rooms";
    return apiClient.get(endpoint);
  },

  /**
   * Get a single room by ID
   * @param {string} id - Room ID
   * @returns {Promise<Room>}
   */
  getById: (id) => apiClient.get(`/rooms/${id}`),

  /**
   * Get rooms by floor ID
   * @param {string} floorId - Floor ID
   * @returns {Promise<Room[]>}
   */
  getByFloor: (floorId) => apiClient.get(`/rooms?floorId=${floorId}`),

  /**
   * Create a new room with beds
   * @param {CreateRoomData} data - Room data
   * @returns {Promise<{room: Room, beds: Bed[]}>}
   */
  create: (data) => apiClient.post("/rooms", data),

  /**
   * Update a room
   * @param {string} id - Room ID
   * @param {UpdateRoomData} data - Room data
   * @returns {Promise<Room>}
   */
  update: (id, data) => apiClient.put(`/rooms/${id}`, data),

  /**
   * Delete a room
   * @param {string} id - Room ID
   * @returns {Promise<{message: string}>}
   */
  delete: (id) => apiClient.delete(`/rooms/${id}`),
};

// ==================== Types (for reference) ====================
/**
 * @typedef {Object} Room
 * @property {string} _id
 * @property {string} roomNumber
 * @property {string|Floor} floor
 * @property {string} roomType - SINGLE, DOUBLE, TRIPLE, DORMITORY
 * @property {number} totalBeds
 * @property {number} occupiedBeds
 * @property {Object} gridPosition
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {Object} CreateRoomData
 * @property {string} roomNumber
 * @property {string} floor - Floor ID
 * @property {string} roomType
 * @property {number} totalBeds
 * @property {Object} [gridPosition]
 */

/**
 * @typedef {Object} UpdateRoomData
 * @property {string} [roomNumber]
 * @property {string} [roomType]
 * @property {Object} [gridPosition]
 */
