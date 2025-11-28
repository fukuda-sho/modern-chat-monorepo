/**
 * @fileoverview メッセージホバー時のアクションバー
 */

'use client';

import { cn } from '@/lib/utils';

type MessageHoverToolbarProps = {
  children: React.ReactNode;
  align?: 'left' | 'right';
};

export function MessageHoverToolbar({
  children,
  align = 'left',
}: MessageHoverToolbarProps): React.ReactElement {
  return (
    <div
      className={cn(
        'absolute -top-8 z-10 flex items-center gap-1 rounded-md border bg-background p-1 shadow-sm',
        align === 'right' ? 'right-0' : 'left-0'
      )}
    >
      {children}
    </div>
  );
}
