/**
 * Beds Hooks
 * React Query hooks for bed data management
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { bedsApi } from "../api";
import { queryKeys } from "./queryKeys";

/**
 * Hook to fetch all beds
 * @param {Object} filters - Query filters
 * @param {string} [filters.floorId] - Filter by floor
 * @param {string} [filters.roomId] - Filter by room
 * @param {string} [filters.status] - Filter by status
 * @param {Object} options - React Query options
 * @returns {UseQueryResult<Bed[]>}
 */
export function useBeds(filters = {}, options = {}) {
  return useQuery({
    queryKey: queryKeys.beds.list(filters),
    queryFn: () => bedsApi.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Hook to fetch available beds
 * @param {Object} options - React Query options
 * @returns {UseQueryResult<Bed[]>}
 */
export function useAvailableBeds(options = {}) {
  return useQuery({
    queryKey: queryKeys.beds.available(),
    queryFn: () => bedsApi.getAvailable(),
    staleTime: 2 * 60 * 1000, // 2 minutes - more frequent for availability
    ...options,
  });
}

/**
 * Hook to fetch beds by room ID
 * @param {string} roomId - Room ID
 * @param {Object} options - React Query options
 * @returns {UseQueryResult<Bed[]>}
 */
export function useBedsByRoom(roomId, options = {}) {
  return useQuery({
    queryKey: queryKeys.beds.byRoom(roomId),
    queryFn: () => bedsApi.getByRoom(roomId),
    enabled: !!roomId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook to fetch beds by floor ID
 * @param {string} floorId - Floor ID
 * @param {Object} options - React Query options
 * @returns {UseQueryResult<Bed[]>}
 */
export function useBedsByFloor(floorId, options = {}) {
  return useQuery({
    queryKey: queryKeys.beds.byFloor(floorId),
    queryFn: () => bedsApi.getByFloor(floorId),
    enabled: !!floorId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook to fetch a single bed by ID
 * @param {string} id - Bed ID
 * @param {Object} options - React Query options
 * @returns {UseQueryResult<Bed>}
 */
export function useBed(id, options = {}) {
  return useQuery({
    queryKey: queryKeys.beds.detail(id),
    queryFn: () => bedsApi.getById(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to prefetch beds data
 * @returns {Function} Prefetch function
 */
export function usePrefetchBeds() {
  const queryClient = useQueryClient();

  return (filters = {}) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.beds.list(filters),
      queryFn: () => bedsApi.getAll(filters),
      staleTime: 5 * 60 * 1000,
    });
  };
}
