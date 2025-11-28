/**
 * ログアウト処理フック
 */

'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { AUTH_TOKEN_KEY } from '@/lib/constants';
import { socketService } from '@/lib/socket';
import { useChatStore } from '@/features/chat/store/chat-store';

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const logout = useCallback(() => {
    // WebSocket 切断
    socketService.disconnect();

    // チャットストアをリセット
    useChatStore.getState().reset();

    // トークン削除
    localStorage.removeItem(AUTH_TOKEN_KEY);

    // クエリキャッシュをクリア
    queryClient.clear();

    // ログインページへリダイレクト
    router.push('/login');
  }, [queryClient, router]);

  return { logout };
}
