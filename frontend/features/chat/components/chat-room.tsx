/**
 * @fileoverview チャットルームコンテナコンポーネント
 * @description WebSocket 接続管理とメッセージ表示を統括するコンテナ
 * ルームへの参加/退出、メッセージ送受信、接続状態表示を担当
 */

'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useChatSocket } from '../hooks/use-chat-socket';
import { fetchChatRoom } from '../api/chat-rooms-api';
import { RoomHeader } from './room-header';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { TypingIndicator } from './typing-indicator';
import { ThreadPane } from './thread-pane';
import { useChatStore } from '../store/chat-store';
import type { Message } from '@/types';

/** チャットルームの Props 型 */
type ChatRoomProps = {
  /** 表示するルームの ID */
  roomId: number;
};

/**
 * チャットルームコンテナコンポーネント
 * クライアントコンポーネントとして以下の機能を提供:
 * - API からルーム情報を取得
 * - WebSocket でのルーム参加/退出管理（roomId 変更時に自動切り替え）
 * - リアルタイムメッセージ送受信
 * - 接続状態に応じた UI 表示（接続中/エラー）
 * - タイピングインジケーター表示
 *
 * @param props - チャットルーム用 props
 * @returns チャットルームの JSX 要素
 */
export function ChatRoom({ roomId }: ChatRoomProps): React.JSX.Element {
  const { joinRoom, leaveRoom, sendMessage, isConnected, connectionStatus } =
    useChatSocket();
  const activeThreadParentId = useChatStore((state) => state.activeThreadParentId);
  const setActiveThread = useChatStore((state) => state.setActiveThread);

  // ルーム情報を API から取得
  const {
    data: room,
    isLoading: isRoomLoading,
    isError: isRoomError,
  } = useQuery({
    queryKey: ['chat-room', roomId],
    queryFn: () => fetchChatRoom(roomId),
  });

  // roomId が変わったときにルームに参加/退出
  useEffect(() => {
    if (!isConnected || !room) {
      return;
    }

    joinRoom(roomId);
    setActiveThread(null);

    return () => {
      leaveRoom(roomId);
    };
  }, [roomId, isConnected, room, joinRoom, leaveRoom, setActiveThread]);

  const handleSendMessage = (content: string): void => {
    if (!isConnected) {
      console.warn('[ChatRoom] Cannot send message: not connected');
      return;
    }
    sendMessage(roomId, content);
  };

  const handleOpenThread = (message: Message): void => {
    setActiveThread(message.id);
  };

  const handleCloseThread = (): void => {
    setActiveThread(null);
  };

  // ルーム読み込み中
  if (isRoomLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="border-primary h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" />
          <span className="text-muted-foreground">読み込み中...</span>
        </div>
      </div>
    );
  }

  // ルームが見つからない（404）
  if (isRoomError || !room) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-destructive">
          チャンネルが見つかりません（ID: {roomId}）
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="flex flex-1 flex-col">
        <RoomHeader roomId={roomId} roomName={room.name} />

        {/* 接続中の場合はローディング表示 */}
        {connectionStatus === 'connecting' && (
          <div className="bg-muted/50 flex items-center justify-center gap-2 py-2 text-sm">
            <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
            <span className="text-muted-foreground">接続中...</span>
          </div>
        )}

        {/* 接続エラーの場合は警告表示 */}
        {connectionStatus === 'error' && (
          <div className="bg-destructive/10 text-destructive flex items-center justify-center py-2 text-sm">
            接続エラーが発生しました。ページを再読み込みしてください。
          </div>
        )}

        <MessageList roomId={roomId} className="flex-1" onOpenThread={handleOpenThread} />

        {/* タイピングインジケーター */}
        <TypingIndicator roomId={roomId} />

        <MessageInput
          roomId={roomId}
          onSend={handleSendMessage}
          disabled={!isConnected}
        />
      </div>

      {activeThreadParentId && (
        <ThreadPane parentMessageId={activeThreadParentId} onClose={handleCloseThread} />
      )}
    </div>
  );
}
