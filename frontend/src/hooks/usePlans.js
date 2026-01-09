/**
 * Plans Hooks
 * React Query hooks for plan data management
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { plansApi } from "../api";
import { queryKeys } from "./queryKeys";

/**
 * Hook to fetch all plans
 * @param {Object} options - React Query options
 * @returns {UseQueryResult<Plan[]>}
 */
export function usePlans(options = {}) {
  return useQuery({
    queryKey: queryKeys.plans.list(),
    queryFn: () => plansApi.getAll(),
    staleTime: 10 * 60 * 1000, // 10 minutes - plans rarely change
    ...options,
  });
}

/**
 * Hook to initialize default plans
 * @returns {UseMutationResult}
 */
export function useInitializePlans() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => plansApi.initialize(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.all });
    },
  });
}

/**
 * Hook to create a new plan
 * @returns {UseMutationResult}
 */
export function useCreatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => plansApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.all });
    },
  });
}

/**
 * Hook to update a plan
 * @returns {UseMutationResult}
 */
export function useUpdatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => plansApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.all });
      // Invalidate tenants since plan price affects them
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.all });
    },
  });
}

/**
 * Hook to delete a plan
 * @returns {UseMutationResult}
 */
export function useDeletePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => plansApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.all });
    },
  });
}
