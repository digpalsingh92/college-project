import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthUser } from "@/types";
import type { AuthUserDto } from "@/types/api";
import {
  clearAuthCookie,
  clearToken,
  getStoredUserJson,
  getToken,
  isTokenExpired,
  setAuthCookie,
  setStoredUserJson,
  setToken,
} from "@/lib/auth";

export interface AuthSliceState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
}

const initialState: AuthSliceState = {
  token: null,
  user: null,
  isAuthenticated: false,
};

export function mapAuthUserDto(dto: AuthUserDto): AuthUser {
  return {
    id: dto.id,
    name: dto.name,
    email: dto.email,
    role: dto.role as AuthUser["role"],
    doctorProfile: dto.doctorProfile,
  };
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ token: string; user: AuthUser }>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      if (typeof window !== "undefined") {
        setToken(action.payload.token);
        setStoredUserJson(JSON.stringify(action.payload.user));
        setAuthCookie(action.payload.token);
      }
    },
    logout(state) {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      if (typeof window !== "undefined") {
        clearToken();
        clearAuthCookie();
      }
    },
    hydrateFromStorage(state) {
      if (typeof window === "undefined") return;
      const token = getToken();
      const raw = getStoredUserJson();

      // No token stored — nothing to hydrate
      if (!token || !raw) return;

      // Token exists but is expired — clear everything, treat as logged out
      if (isTokenExpired(token)) {
        clearToken();
        clearAuthCookie();
        return;
      }

      try {
        const user = JSON.parse(raw) as AuthUser;
        state.token = token;
        state.user = user;
        state.isAuthenticated = true;
        setAuthCookie(token);
      } catch {
        clearToken();
        clearAuthCookie();
      }
    },
  },
});

export const { setCredentials, logout, hydrateFromStorage } = authSlice.actions;
export const authReducer = authSlice.reducer;
