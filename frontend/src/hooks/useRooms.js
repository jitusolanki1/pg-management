/**
 * Rooms Hooks
 * React Query hooks for room data management
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { roomsApi } from "../api";
import { queryKeys } from "./queryKeys";

/**
 * Hook to fetch all rooms
 * @param {Object} filters - Query filters
 * @param {string} [filters.floorId] - Filter by floor
 * @param {Object} options - React Query options
 * @returns {UseQueryResult<Room[]>}
 */
export function useRooms(filters = {}, options = {}) {
  return useQuery({
    queryKey: queryKeys.rooms.list(filters),
    queryFn: () => roomsApi.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Hook to fetch rooms by floor ID
 * @param {string} floorId - Floor ID
 * @param {Object} options - React Query options
 * @returns {UseQueryResult<Room[]>}
 */
export function useRoomsByFloor(floorId, options = {}) {
  return useQuery({
    queryKey: queryKeys.rooms.byFloor(floorId),
    queryFn: () => roomsApi.getByFloor(floorId),
    enabled: !!floorId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook to fetch a single room by ID
 * @param {string} id - Room ID
 * @param {Object} options - React Query options
 * @returns {UseQueryResult<Room>}
 */
export function useRoom(id, options = {}) {
  return useQuery({
    queryKey: queryKeys.rooms.detail(id),
    queryFn: () => roomsApi.getById(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to create a new room with beds
 * @returns {UseMutationResult}
 */
export function useCreateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => roomsApi.create(data),
    onSuccess: (_, variables) => {
      // Invalidate rooms list and floor-specific queries
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.beds.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.floors.detail(variables.floor),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

/**
 * Hook to update a room
 * @returns {UseMutationResult}
 */
export function useUpdateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => roomsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.rooms.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.lists() });
    },
  });
}

/**
 * Hook to delete a room
 * @returns {UseMutationResult}
 */
export function useDeleteRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => roomsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.beds.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.floors.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}
