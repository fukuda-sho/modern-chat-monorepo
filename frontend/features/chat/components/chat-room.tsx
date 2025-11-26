/**
 * チャットルームコンテナコンポーネント
 */

'use client';

import { useEffect } from 'react';
import { useChatSocket } from '../hooks/use-chat-socket';
import { useMessages } from '../hooks/use-messages';
import { RoomHeader } from './room-header';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';

interface ChatRoomProps {
  roomId: number;
  roomName?: string;
}

export function ChatRoom({ roomId, roomName }: ChatRoomProps) {
  const { joinRoom, leaveRoom, sendMessage, isConnected } = useChatSocket();
  const messages = useMessages(roomId);

  useEffect(() => {
    if (isConnected) {
      joinRoom(roomId);
    }

    return () => {
      if (isConnected) {
        leaveRoom(roomId);
      }
    };
  }, [roomId, isConnected, joinRoom, leaveRoom]);

  const handleSendMessage = (content: string) => {
    sendMessage(roomId, content);
  };

  return (
    <div className="flex h-full flex-col">
      <RoomHeader roomId={roomId} roomName={roomName} />
      <MessageList messages={messages} className="flex-1" />
      <MessageInput onSend={handleSendMessage} disabled={!isConnected} />
    </div>
  );
}
