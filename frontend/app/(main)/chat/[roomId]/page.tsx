/**
 * 個別チャットルームページ
 */

import { ChatRoom, getRoomById, isValidRoomId } from '@/features/chat';

interface ChatRoomPageProps {
  params: Promise<{
    roomId: string;
  }>;
}

export default async function ChatRoomPage({ params }: ChatRoomPageProps) {
  const { roomId } = await params;
  const roomIdNum = Number(roomId);

  // 無効な数値の場合
  if (isNaN(roomIdNum)) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-destructive">無効なルームIDです</p>
      </div>
    );
  }

  // 存在しないルームの場合
  if (!isValidRoomId(roomIdNum)) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-destructive">
          チャンネルが見つかりません（ID: {roomIdNum}）
        </p>
      </div>
    );
  }

  const room = getRoomById(roomIdNum);

  return <ChatRoom roomId={roomIdNum} roomName={room?.name} />;
}
