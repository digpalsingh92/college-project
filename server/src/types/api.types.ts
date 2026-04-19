export type Role = 'patient' | 'doctor' | 'admin';

export interface JwtPayload {
  id: string;
  email: string;
  role: Role;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResult<T> {
  data: T;
  pagination?: PaginationMeta;
}

// Generic success response envelope
export interface ApiResponse<T> {
  status: true;
  statusCode: number;
  message: string;
  result: ApiResult<T>;
}

// Generic error response envelope
export interface ApiErrorResponse {
  status: false;
  statusCode: number;
  message: string;
}

// Auth payload only
export interface AuthData {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    createdAt: Date;
    doctorProfile?: {
      specialization: string;
      experience: number;
      consultationFee: number;
    };
  };
}

export type AuthResponse = ApiResponse<AuthData>;