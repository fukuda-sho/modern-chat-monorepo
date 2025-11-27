/**
 * メッセージ取得フック
 */

'use client';

import { useChatStore } from '../store/chat-store';
import type { Message } from '@/types';

/**
 * 空のメッセージ配列（参照の安定性を保つため定数として定義）
 * Zustand のセレクタで毎回新しい配列を返すと無限ループになるため
 */
const EMPTY_MESSAGES: Message[] = [];

/**
 * 特定ルームのメッセージを取得
 * @param roomId - ルームID
 * @returns メッセージ配列（存在しない場合は空配列）
 */
export function useMessages(roomId: number): Message[] {
  return useChatStore((state) => state.messages.get(roomId) ?? EMPTY_MESSAGES);
}
