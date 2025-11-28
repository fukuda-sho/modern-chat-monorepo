/**
 * WebSocket 接続管理フック
 */

'use client';

import { useEffect, useCallback } from 'react';
import { socketService } from '@/lib/socket';
import { useChatStore } from '../store/chat-store';

/**
 * WebSocket 接続を管理するカスタムフック
 */
export function useChatSocket() {
  const connectionStatus = useChatStore((state) => state.connectionStatus);
  const isConnected = connectionStatus === 'connected';

  // コンポーネントマウント時に接続
  // NOTE: disconnect はここでは行わない。複数コンポーネントが useChatSocket() を
  // 使用するため、個別コンポーネントのアンマウント時に切断すると他のコンポーネントに影響する。
  // 接続の終了はログアウト時などアプリケーションレベルで管理する。
  useEffect(() => {
    socketService.connectWithStoredToken();
  }, []);

  // ルーム参加
  const joinRoom = useCallback((roomId: number) => {
    socketService.joinRoom(roomId);
  }, []);

  // ルーム退出
  const leaveRoom = useCallback((roomId: number) => {
    socketService.leaveRoom(roomId);
  }, []);

  // メッセージ送信
  const sendMessage = useCallback((roomId: number, content: string) => {
    socketService.sendMessage(roomId, content);
  }, []);

  const createThreadReply = useCallback(
    (parentMessageId: number, content: string, localId?: string) => {
      socketService.createThreadReply(parentMessageId, content, localId);
    },
    [],
  );

  return {
    isConnected,
    connectionStatus,
    joinRoom,
    leaveRoom,
    sendMessage,
    createThreadReply,
  };
}
