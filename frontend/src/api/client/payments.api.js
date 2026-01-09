/**
 * Payments API
 * Handles all payment-related API calls
 */

import apiClient from "../apiClient";

export const paymentsApi = {
  /**
   * Get all payments
   * @param {Object} [params] - Query parameters
   * @param {string} [params.status] - Filter by status (PAID, PENDING, OVERDUE)
   * @param {string} [params.tenantId] - Filter by tenant ID
   * @returns {Promise<Payment[]>}
   */
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/payments?${queryString}` : "/payments";
    return apiClient.get(endpoint);
  },

  /**
   * Get paid payments
   * @returns {Promise<Payment[]>}
   */
  getPaid: () => apiClient.get("/payments/paid"),

  /**
   * Get unpaid payments (pending + overdue)
   * @returns {Promise<Payment[]>}
   */
  getUnpaid: () => apiClient.get("/payments/unpaid"),

  /**
   * Get payment history for a tenant
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<Payment[]>}
   */
  getByTenant: (tenantId) => apiClient.get(`/payments/tenant/${tenantId}`),

  /**
   * Create a new payment
   * @param {CreatePaymentData} data - Payment data
   * @returns {Promise<Payment>}
   */
  create: (data) => apiClient.post("/payments", data),

  /**
   * Update a payment
   * @param {string} id - Payment ID
   * @param {UpdatePaymentData} data - Payment data
   * @returns {Promise<Payment>}
   */
  update: (id, data) => apiClient.put(`/payments/${id}`, data),

  /**
   * Delete a payment
   * @param {string} id - Payment ID
   * @returns {Promise<{message: string}>}
   */
  delete: (id) => apiClient.delete(`/payments/${id}`),
};

// ==================== Types (for reference) ====================
/**
 * @typedef {Object} Payment
 * @property {string} _id
 * @property {string|Tenant} tenant
 * @property {number} amount
 * @property {string} paymentType - FULL, PARTIAL
 * @property {string} paymentFor - RENT, DEPOSIT, OTHER
 * @property {Date} paymentDate
 * @property {string} status - PAID, PENDING, OVERDUE
 * @property {number} [remainingDue]
 * @property {Date} [nextDueDate]
 * @property {string} [notes]
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {Object} CreatePaymentData
 * @property {string} tenant - Tenant ID
 * @property {number} amount
 * @property {string} paymentType - FULL, PARTIAL
 * @property {string} paymentFor - RENT, DEPOSIT, OTHER
 * @property {Date} [paymentDate]
 * @property {number} [remainingDue]
 * @property {Date} [nextDueDate]
 * @property {string} [notes]
 */

/**
 * @typedef {Object} UpdatePaymentData
 * @property {number} [amount]
 * @property {string} [status]
 * @property {number} [remainingDue]
 * @property {Date} [nextDueDate]
 * @property {string} [notes]
 */
