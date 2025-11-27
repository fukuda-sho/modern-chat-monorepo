/**
 * @fileoverview サイドバーコンポーネント
 * @description チャットルーム一覧を表示するサイドバー
 * MainLayout 内で使用され、ルーム選択・作成機能を提供
 */

'use client';

import { RoomList } from '@/features/chat';
import { cn } from '@/lib/utils';

/** サイドバーの Props 型 */
type SidebarProps = {
  /** 追加の CSS クラス名（位置・表示制御用） */
  className?: string;
};

/**
 * サイドバーコンポーネント
 * クライアントコンポーネントとして以下の機能を提供:
 * - チャットルーム一覧の表示（RoomList）
 * - 固定幅（w-64）でボーダー付きのアサイドエリア
 * - className で位置やトランジションを外部から制御可能
 *
 * @param props - サイドバー用 props
 * @returns サイドバーの JSX 要素
 */
export function Sidebar({ className }: SidebarProps): React.JSX.Element {
  return (
    <aside
      className={cn(
        'bg-muted/40 flex h-full w-64 flex-col border-r',
        className
      )}
    >
      <RoomList />
    </aside>
  );
}
