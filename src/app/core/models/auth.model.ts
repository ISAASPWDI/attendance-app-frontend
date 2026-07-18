import { User, UserRole } from './user.model';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  status: string;
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
}

export interface VerifyEmailRequest {
  username: string;
  code: string;
}

export interface UsernameOnlyRequest {
  username: string;
}

export interface ResetPasswordRequest {
  username: string;
  code: string;
  newPassword: string;
}
