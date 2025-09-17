import { QueryClient } from '@tanstack/react-query';

// Single-flight pattern to prevent duplicate requests
const inFlight = new Map<string, Promise<any>>();

export function singleFlight<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (inFlight.has(key)) {
    console.log(`Reusing in-flight request for ${key}`);
    return inFlight.get(key)!;
  }
  
  const promise = fn().finally(() => {
    inFlight.delete(key);
  });
  
  inFlight.set(key, promise);
  return promise;
}

// Global query client with smart defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 30 seconds before considering it stale
      staleTime: 30_000,
      // Keep data in cache for 5 minutes after component unmounts
      gcTime: 5 * 60_000,
      // Retry failed requests with exponential backoff
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 2 times for 5xx errors with backoff
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch when window regains focus
      refetchOnWindowFocus: true,
      // Don't refetch on reconnect by default
      refetchOnReconnect: false,
    },
  },
});

// Visibility-aware polling
export function getPollingInterval(baseInterval: number): number | false {
  // Only poll when document is visible
  if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
    return false;
  }
  return baseInterval;
}

// Query keys for consistent caching
export const queryKeys = {
  challenges: ['challenges'] as const,
  teamStats: ['teamStats'] as const,
  playerProgress: (viewMode: string) => ['playerProgress', viewMode] as const,
  leaderboard: (period: string) => ['leaderboard', period] as const,
  activityHistory: ['activityHistory'] as const,
} as const;
