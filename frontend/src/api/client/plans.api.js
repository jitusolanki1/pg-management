/**
 * Plans API
 * Handles all plan-related API calls
 */

import apiClient from "../apiClient";

export const plansApi = {
  /**
   * Get all plans
   * @returns {Promise<Plan[]>}
   */
  getAll: () => apiClient.get("/plans"),

  /**
   * Initialize default plans
   * @returns {Promise<Plan[]>}
   */
  initialize: () => apiClient.post("/plans/init"),

  /**
   * Create a new plan
   * @param {CreatePlanData} data - Plan data
   * @returns {Promise<Plan>}
   */
  create: (data) => apiClient.post("/plans", data),

  /**
   * Update a plan
   * @param {string} id - Plan ID
   * @param {UpdatePlanData} data - Plan data
   * @returns {Promise<Plan>}
   */
  update: (id, data) => apiClient.put(`/plans/${id}`, data),

  /**
   * Delete a plan
   * @param {string} id - Plan ID
   * @returns {Promise<{message: string}>}
   */
  delete: (id) => apiClient.delete(`/plans/${id}`),
};

// ==================== Types (for reference) ====================
/**
 * @typedef {Object} Plan
 * @property {string} _id
 * @property {string} name - FULLY_PLAN, HALF_PLAN
 * @property {number} price
 * @property {string} description
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {Object} CreatePlanData
 * @property {string} name
 * @property {number} price
 * @property {string} [description]
 */

/**
 * @typedef {Object} UpdatePlanData
 * @property {string} [name]
 * @property {number} [price]
 * @property {string} [description]
 */
