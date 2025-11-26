/**
 * メッセージ取得フック
 */

'use client';

import { useChatStore } from '../store/chat-store';

/**
 * 特定ルームのメッセージを取得
 */
export function useMessages(roomId: number) {
  return useChatStore((state) => state.messages.get(roomId) || []);
}
