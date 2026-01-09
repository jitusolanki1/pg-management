/**
 * Tenants Hooks
 * React Query hooks for tenant data management
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tenantsApi } from "../api";
import { queryKeys } from "./queryKeys";

/**
 * Hook to fetch all tenants
 * @param {Object} filters - Query filters
 * @param {string} [filters.status] - Filter by status
 * @param {Object} options - React Query options
 * @returns {UseQueryResult<Tenant[]>}
 */
export function useTenants(filters = {}, options = {}) {
  return useQuery({
    queryKey: queryKeys.tenants.list(filters),
    queryFn: () => tenantsApi.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Hook to fetch active tenants
 * @param {Object} options - React Query options
 * @returns {UseQueryResult<Tenant[]>}
 */
export function useActiveTenants(options = {}) {
  return useQuery({
    queryKey: queryKeys.tenants.active(),
    queryFn: () => tenantsApi.getActive(),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook to fetch a single tenant by ID
 * @param {string} id - Tenant ID
 * @param {Object} options - React Query options
 * @returns {UseQueryResult<Tenant>}
 */
export function useTenant(id, options = {}) {
  return useQuery({
    queryKey: queryKeys.tenants.detail(id),
    queryFn: () => tenantsApi.getById(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to create a new tenant
 * @returns {UseMutationResult}
 */
export function useCreateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => tenantsApi.create(data),
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.beds.all }); // Bed becomes occupied
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.all }); // Room occupancy changes
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

/**
 * Hook to update a tenant
 * @returns {UseMutationResult}
 */
export function useUpdateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => tenantsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tenants.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

/**
 * Hook to delete a tenant
 * @returns {UseMutationResult}
 */
export function useDeleteTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => tenantsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.beds.all }); // Bed becomes available
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

/**
 * Hook to prefetch tenant data
 * @returns {Function} Prefetch function
 */
export function usePrefetchTenant() {
  const queryClient = useQueryClient();

  return (id) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.tenants.detail(id),
      queryFn: () => tenantsApi.getById(id),
      staleTime: 5 * 60 * 1000,
    });
  };
}
