import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from './client';
import { queryKeys } from './queryClient';
import type { Wallet } from './types';

export function useWallet(): UseQueryResult<Wallet, Error> {
  return useQuery<Wallet>({
    queryKey: queryKeys.wallet,
    queryFn: () => api<Wallet>('/api/wallet'),
  });
}
