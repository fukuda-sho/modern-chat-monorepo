/**
 * ルーム未選択時の表示コンポーネント
 */

import { MessageSquare } from 'lucide-react';

export function EmptyRoom() {
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
