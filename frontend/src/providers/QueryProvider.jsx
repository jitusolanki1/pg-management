/**
 * React Query Provider
 * Configures QueryClient with optimal settings for PG Management
 */

import { QueryClient, QueryClientProvider, keepPreviousData } from "@tanstack/react-query";

// Create QueryClient with default options
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Data is considered fresh for 2 minutes
            staleTime: 2 * 60 * 1000,
            // Cache data for 5 minutes
            gcTime: 5 * 60 * 1000,
            // Retry failed requests 2 times
            retry: 2,
            // Don't retry on 401 (auth) errors
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            // Refetch on window focus for fresh data
            refetchOnWindowFocus: false,
            // Don't refetch when component mounts if data is fresh
            refetchOnMount: false,
            // Handle network reconnection
            refetchOnReconnect: true,
            // Keep previous data while fetching new data - prevents flash/blink
            placeholderData: keepPreviousData,
        },
        mutations: {
            // Retry mutations once on failure
            retry: 1,
            // Handle errors globally
            onError: (error) => {
                console.error("Mutation error:", error);
            },
        },
    },
});

/**
 * Query Provider Component
 * Wrap your app with this to enable React Query
 */
export function QueryProvider({ children }) {
    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}

// Export queryClient for advanced use cases
export { queryClient };
