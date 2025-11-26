/**
 * 個別チャットルームページ
 */

import { ChatRoom } from '@/features/chat';

interface ChatRoomPageProps {
  params: Promise<{
    roomId: string;
  }>;
}

export default async function ChatRoomPage({ params }: ChatRoomPageProps) {
  const { roomId } = await params;
  const roomIdNum = Number(roomId);

  if (isNaN(roomIdNum)) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-destructive">無効なルームIDです</p>
      </div>
    );
  }

  return <ChatRoom roomId={roomIdNum} />;
}
