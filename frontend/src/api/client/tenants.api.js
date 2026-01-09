/**
 * Tenants API
 * Handles all tenant-related API calls
 */

import apiClient from "../apiClient";

export const tenantsApi = {
  /**
   * Get all tenants
   * @param {Object} [params] - Query parameters
   * @param {string} [params.status] - Filter by status (ACTIVE, INACTIVE)
   * @returns {Promise<Tenant[]>}
   */
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/tenants?${queryString}` : "/tenants";
    return apiClient.get(endpoint);
  },

  /**
   * Get a single tenant by ID
   * @param {string} id - Tenant ID
   * @returns {Promise<Tenant>}
   */
  getById: (id) => apiClient.get(`/tenants/${id}`),

  /**
   * Get active tenants
   * @returns {Promise<Tenant[]>}
   */
  getActive: () => apiClient.get("/tenants?status=ACTIVE"),

  /**
   * Create a new tenant
   * @param {CreateTenantData} data - Tenant data
   * @returns {Promise<Tenant>}
   */
  create: (data) => apiClient.post("/tenants", data),

  /**
   * Update a tenant
   * @param {string} id - Tenant ID
   * @param {UpdateTenantData} data - Tenant data
   * @returns {Promise<Tenant>}
   */
  update: (id, data) => apiClient.put(`/tenants/${id}`, data),

  /**
   * Delete a tenant
   * @param {string} id - Tenant ID
   * @returns {Promise<{message: string}>}
   */
  delete: (id) => apiClient.delete(`/tenants/${id}`),
};

// ==================== Types (for reference) ====================
/**
 * @typedef {Object} Tenant
 * @property {string} _id
 * @property {string} name
 * @property {number} age
 * @property {string} phone
 * @property {string} [email]
 * @property {string} [profilePhoto]
 * @property {string} [aadhaarFront]
 * @property {string} [aadhaarBack]
 * @property {string|Plan} plan
 * @property {string|Bed} bed
 * @property {boolean} clothWashing
 * @property {number} monthlyRent
 * @property {Object} deposit
 * @property {number} deposit.amount
 * @property {number} deposit.months
 * @property {Date} deposit.paidDate
 * @property {string} status - ACTIVE, INACTIVE
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {Object} CreateTenantData
 * @property {string} name
 * @property {number} age
 * @property {string} phone
 * @property {string} [email]
 * @property {string} [profilePhoto]
 * @property {string} [aadhaarFront]
 * @property {string} [aadhaarBack]
 * @property {string} plan - Plan ID
 * @property {string} bed - Bed ID
 * @property {boolean} clothWashing
 * @property {number} depositMonths
 */

/**
 * @typedef {Object} UpdateTenantData
 * @property {string} [name]
 * @property {number} [age]
 * @property {string} [phone]
 * @property {string} [email]
 * @property {boolean} [clothWashing]
 * @property {string} [status]
 */
