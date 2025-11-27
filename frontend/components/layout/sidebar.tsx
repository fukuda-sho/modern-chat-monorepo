/**
 * @fileoverview サイドバーコンポーネント
 * @description チャットルーム一覧を表示するアコーディオンサイドバー
 * MainLayout 内で使用され、チャンネル選択・作成・検索機能を提供
 */

'use client';

import { SidebarAccordion } from '@/features/chat/components/sidebar-accordion';
import { cn } from '@/lib/utils';

/** サイドバーの Props 型 */
type SidebarProps = {
  /** 追加の CSS クラス名（位置・表示制御用） */
  className?: string;
};

/**
 * サイドバーコンポーネント
 * クライアントコンポーネントとして以下の機能を提供:
 * - Slack ライクなアコーディオンサイドバー
 * - Starred / Channels / DM の3セクション
 * - チャンネル参加・作成機能
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
        'bg-muted/40 flex h-full w-64 flex-col border-r overflow-y-auto',
        className
      )}
    >
      <div className="p-2">
        <SidebarAccordion />
      </div>
    </aside>
  );
}
