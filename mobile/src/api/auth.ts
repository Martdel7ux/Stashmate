import { useMutation } from '@tanstack/react-query';
import { api } from './client';
import { queryClient } from './queryClient';
import { useAuthStore } from '@/store/authStore';
import type { AuthResponse } from './types';

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: (input: { email: string; password: string }) =>
      api<AuthResponse>('/api/auth/login', { method: 'POST', body: input, auth: false }),
    onSuccess: async (res) => {
      await setSession({
        userId: res.userId,
        email: res.email,
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
      });
      queryClient.clear();
    },
  });
}

export function useRegister() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: (input: { email: string; password: string }) =>
      api<AuthResponse>('/api/auth/register', { method: 'POST', body: input, auth: false }),
    onSuccess: async (res) => {
      await setSession({
        userId: res.userId,
        email: res.email,
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
      });
      queryClient.clear();
    },
  });
}

export function useLogout() {
  const clear = useAuthStore((s) => s.clear);
  return async () => {
    await clear();
    queryClient.clear();
  };
}
