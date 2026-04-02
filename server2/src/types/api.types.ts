export type Role = 'doctor';

export interface JwtPayload {
  id: string;
  email: string;
  role: Role;
}

export interface Response {
  token: string;
  data: {
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
