/**
 * 自動スクロールフック
 */

'use client';

import { useEffect, type RefObject } from 'react';
import type { Message } from '@/types';

/**
 * メッセージ更新時に自動スクロール
 */
export function useScrollToBottom(
  ref: RefObject<HTMLDivElement | null>,
  messages: Message[]
) {
  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [messages, ref]);
}
