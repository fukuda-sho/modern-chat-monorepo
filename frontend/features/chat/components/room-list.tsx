/**
 * ルーム一覧コンポーネント
 */

'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RoomItem } from './room-item';
import { CreateRoomDialog, CHAT_ROOMS_QUERY_KEY } from './create-room-dialog';
import { fetchChatRooms } from '../api/chat-rooms-api';
import { MOCK_ROOMS } from '../data/rooms';

/**
 * ルーム一覧コンポーネント
 * API からルーム一覧を取得して表示する
 * @returns ルーム一覧コンポーネント
 */
export function RoomList() {
  const params = useParams();
  const currentRoomId = params.roomId ? Number(params.roomId) : null;

  const { data: rooms, isLoading } = useQuery({
    queryKey: CHAT_ROOMS_QUERY_KEY,
    queryFn: fetchChatRooms,
  });

  // API エラー時またはデータ未取得時はモックデータにフォールバック
  const displayRooms = rooms ?? MOCK_ROOMS;

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          <h2 className="text-muted-foreground mb-2 px-2 text-xs font-semibold tracking-wider uppercase">
            Channels
          </h2>
          {isLoading ? (
            <div className="text-muted-foreground px-2 py-4 text-sm">
              読み込み中...
            </div>
          ) : (
            displayRooms.map((room) => (
              <RoomItem
                key={room.id}
                room={room}
                isActive={room.id === currentRoomId}
              />
            ))
          )}
        </div>
      </ScrollArea>
      <div className="border-t p-2">
        <CreateRoomDialog />
      </div>
    </div>
  );
}
