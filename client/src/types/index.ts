import { ReactNode } from "react";

export type UserRole = "admin" | "doctor" | "patient";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  doctorProfile?: {
    specialization: string;
    experience: number;
    consultationFee: number;
  };
}

export interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
}

export interface ApiSuccess<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  status?: number;
}

export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  className?: string;
  render?: (row: T) => ReactNode;
}
