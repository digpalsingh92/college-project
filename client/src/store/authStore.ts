import { create } from 'zustand';
import { AuthUser } from '@/types';
import { saveAuth, clearAuth, getStoredUser, getToken } from '@/lib/auth';

interface AuthStore {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setAuth: (token, user) => {
    saveAuth(token, user);
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    clearAuth();
    set({ token: null, user: null, isAuthenticated: false });
  },

  hydrate: () => {
    const token = getToken();
    const user  = getStoredUser();
    if (token && user) {
      set({ token, user, isAuthenticated: true });
    }
  },
}));
