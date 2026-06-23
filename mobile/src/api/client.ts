import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getAccessToken, useAuthStore } from '@/store/authStore';

/**
 * Resolve the API base URL. Android emulators can't reach the host's "localhost",
 * so we rewrite it to the emulator loopback (10.0.2.2).
 */
function resolveBaseUrl(): string {
  const configured = (Constants.expoConfig?.extra?.apiUrl as string) || 'http://localhost:5000';
  if (Platform.OS === 'android') {
    return configured.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
  }
  return configured;
}

export const API_BASE_URL = resolveBaseUrl();

export class ApiError extends Error {
  constructor(public status: number, message: string, public body?: unknown) {
    super(message);
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean;
}

export async function api<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // 401 on an authed request => session is stale; sign the user out.
  if (res.status === 401 && auth) {
    await useAuthStore.getState().clear();
  }

  const text = await res.text();
  const data = text ? safeParse(text) : null;

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    if (data && typeof data === 'object' && 'error' in data) {
      message = String((data as { error: unknown }).error);
    }
    throw new ApiError(res.status, message, data);
  }

  return data as T;
}

function safeParse(text: string): unknown {
  try { return JSON.parse(text); } catch { return text; }
}
