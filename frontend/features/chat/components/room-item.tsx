/**
 * @fileoverview ルーム項目コンポーネント
 * @description サイドバーに表示する個別のチャットルーム項目
 * アクティブ状態に応じたスタイル変化、クリックでルームへ遷移
 */

'use client';

import Link from 'next/link';
import { Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Room } from '@/types';

/** ルーム項目の Props 型 */
type RoomItemProps = {
  /** 表示するルームオブジェクト */
  room: Room;
  /** このルームが現在アクティブ（選択中）かどうか */
  isActive: boolean;
};

/**
 * ルーム項目コンポーネント
 * クライアントコンポーネントとして以下の機能を提供:
 * - ハッシュアイコンとルーム名を表示
 * - アクティブ時はハイライトスタイルを適用
 * - クリックで /chat/{roomId} へ遷移
 *
 * @param props - ルーム項目用 props
 * @returns ルーム項目の JSX 要素
 */
export function RoomItem({ room, isActive }: RoomItemProps): React.JSX.Element {
  return (
    <Link
      href={`/chat/${room.id}`}
      className={cn(
        'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
        isActive
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
    >
      <Hash className="h-4 w-4 shrink-0" />
      <span className="truncate">{room.name}</span>
    </Link>
  );
}
