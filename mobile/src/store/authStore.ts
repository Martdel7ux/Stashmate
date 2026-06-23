import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Auth tokens live here. On native they persist in the device keychain via
 * SecureStore; on web (where SecureStore is unavailable) we fall back to
 * localStorage so the preview survives reloads.
 */
const KEY = 'stash.auth';

interface Session {
  userId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  session: Session | null;
  hydrated: boolean;
  setSession: (s: Session) => Promise<void>;
  clear: () => Promise<void>;
  hydrate: () => Promise<void>;
}

const storage = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try { return globalThis.localStorage?.getItem(key) ?? null; } catch { return null; }
    }
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try { globalThis.localStorage?.setItem(key, value); } catch {}
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async remove(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      try { globalThis.localStorage?.removeItem(key); } catch {}
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  hydrated: false,

  setSession: async (s) => {
    await storage.set(KEY, JSON.stringify(s));
    set({ session: s });
  },

  clear: async () => {
    await storage.remove(KEY);
    set({ session: null });
  },

  hydrate: async () => {
    const raw = await storage.get(KEY);
    set({ session: raw ? (JSON.parse(raw) as Session) : null, hydrated: true });
  },
}));

/** Non-hook accessor for the API client. */
export function getAccessToken(): string | null {
  return useAuthStore.getState().session?.accessToken ?? null;
}
