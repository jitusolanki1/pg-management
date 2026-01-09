/**
 * Dashboard Hooks
 * React Query hooks for dashboard data
 */

import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../api";
import { queryKeys } from "./queryKeys";

/**
 * Hook to fetch dashboard statistics
 * @param {Object} options - React Query options
 * @returns {UseQueryResult<DashboardStats>}
 */
export function useDashboardStats(options = {}) {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: () => dashboardApi.getStats(),
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
    ...options,
  });
}
