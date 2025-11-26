/**
 * API 関連の型定義
 */

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
}

export interface SignupResponse {
  id: number;
  email: string;
  username: string;
  createdAt: string;
}
