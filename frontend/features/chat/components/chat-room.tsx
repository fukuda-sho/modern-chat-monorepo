/**
 * @fileoverview チャットルームコンテナコンポーネント
 * @description WebSocket 接続管理とメッセージ表示を統括するコンテナ
 * ルームへの参加/退出、メッセージ送受信、接続状態表示を担当
 */

'use client';

import { useEffect } from 'react';
import { useChatSocket } from '../hooks/use-chat-socket';
import { useMessages } from '../hooks/use-messages';
import { RoomHeader } from './room-header';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';

/** チャットルームの Props 型 */
type ChatRoomProps = {
  /** 表示するルームの ID */
  roomId: number;
  /** ルーム名（指定がない場合は "Room {id}" を表示） */
  roomName?: string;
};

/**
 * チャットルームコンテナコンポーネント
 * クライアントコンポーネントとして以下の機能を提供:
 * - WebSocket でのルーム参加/退出管理（roomId 変更時に自動切り替え）
 * - リアルタイムメッセージ送受信
 * - 接続状態に応じた UI 表示（接続中/エラー）
 *
 * @param props - チャットルーム用 props
 * @returns チャットルームの JSX 要素
 */
export function ChatRoom({ roomId, roomName }: ChatRoomProps): React.JSX.Element {
  const { joinRoom, leaveRoom, sendMessage, isConnected, connectionStatus } =
    useChatSocket();
  const messages = useMessages(roomId);

  // roomId が変わったときにルームに参加/退出
  useEffect(() => {
    if (!isConnected) {
      return;
    }

    joinRoom(roomId);

    return () => {
      leaveRoom(roomId);
    };
  }, [roomId, isConnected, joinRoom, leaveRoom]);

  const handleSendMessage = (content: string) => {
    if (!isConnected) {
      console.warn('[ChatRoom] Cannot send message: not connected');
      return;
    }
    sendMessage(roomId, content);
  };

  return (
    <div className="flex h-full flex-col">
      <RoomHeader roomId={roomId} roomName={roomName} />

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

      <MessageList messages={messages} className="flex-1" />
      <MessageInput onSend={handleSendMessage} disabled={!isConnected} />
    </div>
  );
}
