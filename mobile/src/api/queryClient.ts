import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        // Don't retry auth/client errors.
        if (error instanceof ApiError && error.status < 500) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
  },
});

export const queryKeys = {
  goals: ['goals'] as const,
  goal: (id: string) => ['goals', id] as const,
  transactions: (id: string) => ['goals', id, 'transactions'] as const,
  wallet: ['wallet'] as const,
};
