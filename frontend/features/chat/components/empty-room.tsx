/**
 * @fileoverview ルーム未選択時の表示コンポーネント
 * @description チャットルームが選択されていない状態で表示するプレースホルダー
 * サイドバーからルームを選択するよう案内するメッセージを表示
 */

import { MessageSquare } from 'lucide-react';

/**
 * ルーム未選択時のプレースホルダーコンポーネント
 * サーバーコンポーネントとしてレンダリング可能
 * - メッセージアイコンと案内テキストを中央配置で表示
 * - ユーザーにサイドバーからルームを選択するよう促す
 *
 * @returns プレースホルダーの JSX 要素
 */
export function EmptyRoom(): React.JSX.Element {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full">
        <MessageSquare className="text-muted-foreground h-8 w-8" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">チャットを始めましょう</h2>
        <p className="text-muted-foreground text-sm">
          左のサイドバーからチャンネルを選択してください
        </p>
      </div>
    </div>
  );
}
