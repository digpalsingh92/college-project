import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthUser } from "@/types";
import type { AuthUserDto } from "@/types/api";
import {
  clearAuthCookie,
  clearToken,
  clearRefreshToken,
  getStoredUserJson,
  getToken,
  getRefreshToken,
  isTokenExpired,
  setAuthCookie,
  setStoredUserJson,
  setToken,
  setRefreshToken,
} from "@/lib/auth";

export interface AuthSliceState {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
}

const initialState: AuthSliceState = {
  token: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
};

export function mapAuthUserDto(dto: AuthUserDto): AuthUser {
  return {
    id: dto.id,
    name: dto.name,
    email: dto.email,
    role: dto.role as AuthUser["role"],
    age: dto.age ?? undefined,
    doctorProfile: dto.doctorProfile,
  };
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ token: string; refreshToken: string; user: AuthUser }>) {
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      if (typeof window !== "undefined") {
        setToken(action.payload.token);
        setRefreshToken(action.payload.refreshToken);
        setStoredUserJson(JSON.stringify(action.payload.user));
        setAuthCookie(action.payload.token);
      }
    },
    logout(state) {
      state.token = null;
      state.refreshToken = null;
      state.user = null;
      state.isAuthenticated = false;
      if (typeof window !== "undefined") {
        clearToken();
        clearRefreshToken();
        clearAuthCookie();
      }
    },
    hydrateFromStorage(state) {
      if (typeof window === "undefined") return;
      const token = getToken();
      const refreshToken = getRefreshToken();
      const raw = getStoredUserJson();

      // No token stored — nothing to hydrate
      if (!token || !raw) return;

      // Access token exists but is expired. Check if refresh token is also expired/missing
      if (isTokenExpired(token)) {
        if (!refreshToken || isTokenExpired(refreshToken)) {
          clearToken();
          clearRefreshToken();
          clearAuthCookie();
          return;
        }
      }

      try {
        const user = JSON.parse(raw) as AuthUser;
        state.token = token;
        state.refreshToken = refreshToken;
        state.user = user;
        state.isAuthenticated = true;
        setAuthCookie(token);
      } catch {
        clearToken();
        clearRefreshToken();
        clearAuthCookie();
      }
    },
  },
});

export const { setCredentials, logout, hydrateFromStorage } = authSlice.actions;
export const authReducer = authSlice.reducer;
