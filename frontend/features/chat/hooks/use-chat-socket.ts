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
  useEffect(() => {
    socketService.connectWithStoredToken();

    return () => {
      socketService.disconnect();
    };
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

  return {
    isConnected,
    connectionStatus,
    joinRoom,
    leaveRoom,
    sendMessage,
  };
}
