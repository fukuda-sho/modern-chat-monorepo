/**
 * ログイン処理フック
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { login } from '../api/auth-api';
import { AUTH_TOKEN_KEY } from '@/lib/constants';
import type { LoginRequest } from '@/types';

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginRequest) => login(data),
    onSuccess: (data) => {
      // JWT をローカルストレージに保存
      localStorage.setItem(AUTH_TOKEN_KEY, data.accessToken);
      // ユーザー情報を再取得
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}
