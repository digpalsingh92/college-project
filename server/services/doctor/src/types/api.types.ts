export type Role = 'doctor';

export interface JwtPayload {
  id: string;
  email: string;
  role: Role;
}

export interface AuthDoctorResponse {
  token: string;
  doctor: {
    id: string;
    name: string;
    email: string;
    specialization: string;
    role: Role;
    createdAt: Date;
  };
}

export interface ApiErrorBody {
  message: string;
  details?: unknown;
}
