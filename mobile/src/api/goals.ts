import { useMutation, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from './client';
import { queryClient, queryKeys } from './queryClient';
import {
  GOAL_STATUS,
  TX_STATUS,
  type CreateGoalInput,
  type Goal,
  type Transaction,
} from './types';

/** Backend serializes enums as ints; coerce them to our string unions. */
function normalizeGoal(raw: any): Goal {
  return {
    ...raw,
    status: typeof raw.status === 'number' ? GOAL_STATUS[raw.status] : raw.status,
  };
}

function normalizeTransaction(raw: any): Transaction {
  return {
    ...raw,
    status: typeof raw.status === 'number' ? TX_STATUS[raw.status] : raw.status,
  };
}

export function useGoals(): UseQueryResult<Goal[], Error> {
  return useQuery<Goal[]>({
    queryKey: queryKeys.goals,
    queryFn: async () => {
      const data = await api<any[]>('/api/goals');
      return data.map(normalizeGoal);
    },
  });
}

export function useGoal(id: string): UseQueryResult<Goal, Error> {
  return useQuery<Goal>({
    queryKey: queryKeys.goal(id),
    queryFn: async () => normalizeGoal(await api<any>(`/api/goals/${id}`)),
    enabled: !!id,
  });
}

export function useTransactions(goalId: string): UseQueryResult<Transaction[], Error> {
  return useQuery<Transaction[]>({
    queryKey: queryKeys.transactions(goalId),
    queryFn: async () => {
      const data = await api<any[]>(`/api/goals/${goalId}/transactions`);
      return data.map(normalizeTransaction);
    },
    enabled: !!goalId,
  });
}

export function useCreateGoal() {
  return useMutation({
    mutationFn: (input: CreateGoalInput) =>
      api<any>('/api/goals', { method: 'POST', body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.goals }),
  });
}

function useGoalLifecycle(action: (id: string) => Promise<unknown>) {
  return useMutation({
    mutationFn: (id: string) => action(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals });
      queryClient.invalidateQueries({ queryKey: queryKeys.goal(id) });
    },
  });
}

export const usePauseGoal = () =>
  useGoalLifecycle((id) => api(`/api/goals/${id}/pause`, { method: 'PATCH' }));

export const useResumeGoal = () =>
  useGoalLifecycle((id) => api(`/api/goals/${id}/resume`, { method: 'PATCH' }));

export const useCancelGoal = () =>
  useGoalLifecycle((id) => api(`/api/goals/${id}`, { method: 'DELETE' }));
