/**
 * @fileoverview タイピングインジケーターコンポーネント
 * @description 「〇〇さんが入力中...」を表示
 */

'use client';

import { useTypingUsers } from '@/features/presence/hooks/use-presence';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';

/** タイピングインジケーターの Props 型 */
type TypingIndicatorProps = {
  /** ルーム ID */
  roomId: number;
};

/**
 * タイピングインジケーターコンポーネント
 * 指定されたルームでタイピング中のユーザーを表示
 * 自分自身は表示しない
 *
 * @param props - タイピングインジケーターの props
 * @returns タイピングインジケーターの JSX 要素、タイピング中のユーザーがいない場合は null
 */
export function TypingIndicator({
  roomId,
}: TypingIndicatorProps): React.JSX.Element | null {
  const typingUsers = useTypingUsers(roomId);
  const { data: currentUser } = useCurrentUser();

  // 自分を除外
  const othersTyping = typingUsers.filter((u) => u.userId !== currentUser?.id);

  if (othersTyping.length === 0) {
    return null;
  }

  const text =
    othersTyping.length === 1
      ? `${othersTyping[0].username} さんが入力中`
      : othersTyping.length === 2
        ? `${othersTyping[0].username} さん、${othersTyping[1].username} さんが入力中`
        : `${othersTyping.length} 人が入力中`;

  return (
    <div className="text-muted-foreground flex items-center gap-2 px-4 py-1 text-xs">
      <span className="flex gap-0.5">
        <span
          className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-current"
          style={{ animationDelay: '0ms' }}
        />
        <span
          className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-current"
          style={{ animationDelay: '150ms' }}
        />
        <span
          className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-current"
          style={{ animationDelay: '300ms' }}
        />
      </span>
      <span>{text}</span>
    </div>
  );
}
