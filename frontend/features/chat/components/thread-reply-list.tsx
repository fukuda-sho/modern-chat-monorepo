/**
 * @fileoverview スレッド返信リスト
 */

'use client';

import { MessageCell } from './message-cell';
import type { Message } from '@/types';

type ThreadReplyListProps = {
  replies: Message[];
  currentUserId: number;
};

export function ThreadReplyList({
  replies,
  currentUserId,
}: ThreadReplyListProps): React.ReactElement {
  if (replies.length === 0) {
    return (
      <div className="text-muted-foreground py-4 text-sm text-center">
        まだ返信がありません。最初の返信を投稿しましょう。
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {replies.map((reply) => (
        <MessageCell key={reply.localId || reply.id} message={reply} currentUserId={currentUserId} />
      ))}
    </div>
  );
}
