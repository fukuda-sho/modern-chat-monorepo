/**
 * 認証関連 API 呼び出し
 */

import { apiClient } from '@/lib/api-client';
import type {
  LoginRequest,
  LoginResponse,
  SignupRequest,
  SignupResponse,
} from '@/types';
import type { User } from '@/types';

/**
 * ログイン API
 * @param data - ログイン情報
 * @returns アクセストークン
 */
export async function login(data: LoginRequest): Promise<LoginResponse> {
  return apiClient.post<LoginResponse>('/auth/login', data);
}

/**
 * サインアップ API
 * @param data - ユーザー登録情報
 * @returns 作成されたユーザー情報
 */
export async function signup(data: SignupRequest): Promise<SignupResponse> {
  return apiClient.post<SignupResponse>('/auth/signup', data);
}

/**
 * 現在のユーザー取得 API
 * @returns ユーザー情報
 */
export async function getCurrentUser(): Promise<User> {
  return apiClient.get<User>('/users/me');
}
