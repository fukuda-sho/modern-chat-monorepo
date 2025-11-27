/**
 * @fileoverview ルームヘッダーコンポーネント
 * @description チャットルーム上部に表示するヘッダー
 * ルーム名、接続状態インジケーター、戻るボタン（モバイル）を表示
 */

'use client';

import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useChatStore } from '../store/chat-store';

/** ルームヘッダーの Props 型 */
type RoomHeaderProps = {
  /** 現在のルーム ID */
  roomId: number;
  /** ルーム名（指定がない場合は "Room {id}" を表示） */
  roomName?: string;
};

/**
 * ルームヘッダーコンポーネント
 * クライアントコンポーネントとして以下の機能を提供:
 * - 接続状態を色で表示（緑: 接続中、黄: 接続処理中、赤: 切断/エラー）
 * - ルーム名の表示
 * - モバイル時は戻るボタンを表示（/chat へ遷移）
 * - 参加人数バッジ（現在は -- で固定表示）
 *
 * @param props - ルームヘッダー用 props
 * @returns ルームヘッダーの JSX 要素
 */
export function RoomHeader({ roomId, roomName }: RoomHeaderProps): React.JSX.Element {
  const connectionStatus = useChatStore((state) => state.connectionStatus);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      default:
        return 'bg-red-500';
    }
  };

  return (
    <header className="bg-background flex items-center gap-3 border-b px-4 py-3">
      <Button variant="ghost" size="icon" asChild className="md:hidden">
        <Link href="/chat">
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">戻る</span>
        </Link>
      </Button>

      <div className="flex flex-1 items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${getStatusColor()}`} />
        <h1 className="font-semibold">{roomName || `Room ${roomId}`}</h1>
      </div>

      <Badge variant="secondary" className="gap-1">
        <Users className="h-3 w-3" />
        <span>--</span>
      </Badge>
    </header>
  );
}
