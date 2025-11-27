/**
 * ルーム一覧コンポーネント
 */

'use client';

import { useParams } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RoomItem } from './room-item';
import { MOCK_ROOMS } from '../data/rooms';

export function RoomList() {
  const params = useParams();
  const currentRoomId = params.roomId ? Number(params.roomId) : null;

  return (
    <ScrollArea className="h-full">
      <div className="space-y-1 p-2">
        <h2 className="text-muted-foreground mb-2 px-2 text-xs font-semibold tracking-wider uppercase">
          Channels
        </h2>
        {MOCK_ROOMS.map((room) => (
          <RoomItem
            key={room.id}
            room={room}
            isActive={room.id === currentRoomId}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
