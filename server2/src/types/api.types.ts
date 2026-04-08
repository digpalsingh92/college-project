export type Role = 'patient' | 'doctor' | 'admin';

export interface JwtPayload {
  id: string;
  email: string;
  role: Role;
}

export interface AuthResponse {
  token: string;
  data: {
    id: string;
    name: string;
    email: string;
    role: Role;
    createdAt: Date;
    specialization?: string;
    experience?: number;
    consultationFee?: number;
  };
}

export interface ApiErrorBody {
  message: string;
  details?: unknown;
}
