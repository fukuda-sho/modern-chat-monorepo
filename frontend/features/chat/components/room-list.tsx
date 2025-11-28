/**
 * @fileoverview ルーム一覧コンポーネント
 * @description サイドバーに表示するチャットルームの一覧
 * TanStack Query で API からルーム一覧を取得、新規ルーム作成ダイアログも配置
 */

'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RoomItem } from './room-item';
import { CreateRoomDialog, CHAT_ROOMS_QUERY_KEY } from './create-room-dialog';
import { fetchChatRooms } from '../api/chat-rooms-api';

/**
 * ルーム一覧コンポーネント
 * クライアントコンポーネントとして以下の機能を提供:
 * - TanStack Query で API からルーム一覧を取得
 * - ローディング中は「読み込み中...」を表示
 * - API エラー時はエラーメッセージを表示
 * - ルームが存在しない場合は空状態を表示
 * - 現在選択中のルームをハイライト表示
 * - 下部に新規ルーム作成ダイアログを配置
 *
 * @returns ルーム一覧の JSX 要素
 */
export function RoomList(): React.JSX.Element {
  const params = useParams();
  const currentRoomId = params.roomId ? Number(params.roomId) : null;

  const { data: rooms, isLoading, isError } = useQuery({
    queryKey: CHAT_ROOMS_QUERY_KEY,
    queryFn: fetchChatRooms,
  });

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
          ) : isError ? (
            <div className="text-destructive px-2 py-4 text-sm">
              ルーム一覧の取得に失敗しました
            </div>
          ) : rooms && rooms.length > 0 ? (
            rooms.map((room) => (
              <RoomItem
                key={room.id}
                room={room}
                isActive={room.id === currentRoomId}
              />
            ))
          ) : (
            <div className="text-muted-foreground px-2 py-4 text-sm">
              ルームがありません
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="border-t p-2">
        <CreateRoomDialog />
      </div>
    </div>
  );
}
