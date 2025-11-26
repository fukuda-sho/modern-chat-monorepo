/**
 * サインアップ処理フック
 */

'use client';

import { useMutation } from '@tanstack/react-query';
import { signup } from '../api/auth-api';
import type { SignupRequest } from '@/types';

export function useSignup() {
  return useMutation({
    mutationFn: (data: SignupRequest) => signup(data),
  });
}
