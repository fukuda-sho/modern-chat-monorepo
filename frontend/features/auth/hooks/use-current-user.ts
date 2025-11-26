/**
 * 現在のユーザー情報取得フック
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '../api/auth-api';
import { AUTH_TOKEN_KEY } from '@/lib/constants';

export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
    retry: false,
    enabled:
      typeof window !== 'undefined' && !!localStorage.getItem(AUTH_TOKEN_KEY),
  });
}
