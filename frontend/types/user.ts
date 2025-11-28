/**
 * ユーザー関連の型定義
 */

export interface User {
  id: number;
  email: string;
  username: string;
  createdAt: string;
}

export interface AuthUser {
  userId: number;
  email: string;
}
