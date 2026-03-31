import { AuthUser } from '@/types';

export const TOKEN_KEY = 'token';
export const USER_KEY  = 'user';

/** Write JWT to both localStorage (for client-side reads) and a cookie (for middleware). */
export const saveAuth = (token: string, user: AuthUser) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  // Set a cookie so the Next.js middleware can read it server-side
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
};

export const clearAuth = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  // Expire the cookie
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
};

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const getStoredUser = (): AuthUser | null => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
};
