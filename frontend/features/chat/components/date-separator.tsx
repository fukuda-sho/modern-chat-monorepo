/**
 * @fileoverview 日付区切りコンポーネント
 * @description Slack 風の日付区切り表示
 */

'use client';

import { memo } from 'react';
import { formatDateSeparator } from '../utils/message-utils';

interface DateSeparatorProps {
  /** ISO 8601 形式の日時文字列 */
  date: string;
}

/**
 * 日付区切りコンポーネント（Slack 風）
 * メッセージリスト内で日付ごとの区切りを表示
 *
 * @param props - 日付区切り用 props
 * @returns 日付区切りの JSX 要素
 */
function DateSeparatorComponent({ date }: DateSeparatorProps): React.JSX.Element {
  return (
    <div className="relative my-4 flex items-center">
      <div className="border-border flex-1 border-t" />
      <span className="border-border bg-background text-muted-foreground mx-4 flex-shrink-0 rounded-full border px-3 py-1 text-xs font-medium">
        {formatDateSeparator(date)}
      </span>
      <div className="border-border flex-1 border-t" />
    </div>
  );
}

/**
 * メモ化された日付区切りコンポーネント
 * props が変更されない限り再レンダリングをスキップ
 */
export const DateSeparator = memo(DateSeparatorComponent);
