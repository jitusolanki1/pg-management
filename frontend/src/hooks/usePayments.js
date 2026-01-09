/**
 * Payments Hooks
 * React Query hooks for payment data management
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentsApi } from "../api";
import { queryKeys } from "./queryKeys";

/**
 * Hook to fetch all payments
 * @param {Object} filters - Query filters
 * @param {string} [filters.status] - Filter by status
 * @param {string} [filters.tenantId] - Filter by tenant
 * @param {Object} options - React Query options
 * @returns {UseQueryResult<Payment[]>}
 */
export function usePayments(filters = {}, options = {}) {
  return useQuery({
    queryKey: queryKeys.payments.list(filters),
    queryFn: () => paymentsApi.getAll(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
}

/**
 * Hook to fetch paid payments
 * @param {Object} options - React Query options
 * @returns {UseQueryResult<Payment[]>}
 */
export function usePaidPayments(options = {}) {
  return useQuery({
    queryKey: queryKeys.payments.paid(),
    queryFn: () => paymentsApi.getPaid(),
    staleTime: 2 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook to fetch unpaid payments
 * @param {Object} options - React Query options
 * @returns {UseQueryResult<Payment[]>}
 */
export function useUnpaidPayments(options = {}) {
  return useQuery({
    queryKey: queryKeys.payments.unpaid(),
    queryFn: () => paymentsApi.getUnpaid(),
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 min for overdue detection
    ...options,
  });
}

/**
 * Hook to fetch payment history for a tenant
 * @param {string} tenantId - Tenant ID
 * @param {Object} options - React Query options
 * @returns {UseQueryResult<Payment[]>}
 */
export function usePaymentsByTenant(tenantId, options = {}) {
  return useQuery({
    queryKey: queryKeys.payments.byTenant(tenantId),
    queryFn: () => paymentsApi.getByTenant(tenantId),
    enabled: !!tenantId,
    staleTime: 2 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook to create a new payment
 * @returns {UseMutationResult}
 */
export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => paymentsApi.create(data),
    onSuccess: (_, variables) => {
      // Invalidate all payment queries
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
      // Invalidate tenant-specific payments
      if (variables.tenant) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.payments.byTenant(variables.tenant),
        });
      }
      // Invalidate dashboard for revenue updates
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

/**
 * Hook to update a payment
 * @returns {UseMutationResult}
 */
export function useUpdatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => paymentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

/**
 * Hook to delete a payment
 * @returns {UseMutationResult}
 */
export function useDeletePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => paymentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}
