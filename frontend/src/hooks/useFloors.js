/**
 * Floors Hooks
 * React Query hooks for floor data management
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { floorsApi } from "../api";
import { queryKeys } from "./queryKeys";

/**
 * Hook to fetch all floors
 * @param {Object} options - React Query options
 * @returns {UseQueryResult<Floor[]>}
 */
export function useFloors(options = {}) {
  return useQuery({
    queryKey: queryKeys.floors.lists(),
    queryFn: () => floorsApi.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Hook to fetch a single floor by ID
 * @param {string} id - Floor ID
 * @param {Object} options - React Query options
 * @returns {UseQueryResult<Floor>}
 */
export function useFloor(id, options = {}) {
  return useQuery({
    queryKey: queryKeys.floors.detail(id),
    queryFn: () => floorsApi.getById(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to create a new floor
 * @returns {UseMutationResult}
 */
export function useCreateFloor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => floorsApi.create(data),
    onSuccess: () => {
      // Invalidate floors list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.floors.all });
      // Also invalidate dashboard stats
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

/**
 * Hook to update a floor
 * @returns {UseMutationResult}
 */
export function useUpdateFloor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => floorsApi.update(id, data),
    onSuccess: (_, variables) => {
      // Invalidate specific floor and list
      queryClient.invalidateQueries({
        queryKey: queryKeys.floors.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.floors.lists() });
    },
  });
}

/**
 * Hook to delete a floor
 * @returns {UseMutationResult}
 */
export function useDeleteFloor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => floorsApi.delete(id),
    onSuccess: () => {
      // Invalidate all floor-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.floors.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}
