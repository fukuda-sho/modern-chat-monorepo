/**
 * @fileoverview 個別メッセージ表示コンポーネント
 * @description チャットメッセージを吹き出し形式で表示する
 * 自分のメッセージと他者のメッセージで配置・色を変える
 * memo 化により不要な再レンダリングを防止
 */

'use client';

import { memo } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { Message } from '@/types';

/** メッセージアイテムの Props 型 */
type MessageItemProps = {
  /** 表示するメッセージオブジェクト */
  message: Message;
  /** 自分のメッセージかどうか（配置・色の制御に使用） */
  isOwn: boolean;
};

/**
 * メッセージの時刻を日本語形式でフォーマット
 * @param dateString - ISO 8601 形式の日時文字列
 * @returns HH:MM 形式の時刻文字列
 */
function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * メッセージアイテム内部コンポーネント
 * クライアントコンポーネントとして以下の機能を提供:
 * - 自分のメッセージは右寄せ、他者は左寄せで表示
 * - 他者のメッセージにはアバター（ユーザー ID 先頭2文字）を表示
 * - メッセージ本文と送信時刻を吹き出し形式で表示
 *
 * @param props - メッセージアイテム用 props
 * @returns メッセージアイテムの JSX 要素
 */
function MessageItemComponent({ message, isOwn }: MessageItemProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex items-end gap-2',
        isOwn ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {!isOwn && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="text-xs">
            {message.userId.toString().slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          'max-w-[70%] rounded-2xl px-4 py-2',
          isOwn
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-muted rounded-bl-sm'
        )}
      >
        <p className="text-sm break-words">{message.content}</p>
        <time
          className={cn(
            'mt-1 block text-xs',
            isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
          )}
        >
          {formatMessageTime(message.createdAt)}
        </time>
      </div>
    </div>
  );
}

/**
 * メモ化されたメッセージアイテムコンポーネント
 * props が変更されない限り再レンダリングをスキップ
 */
export const MessageItem = memo(MessageItemComponent);
