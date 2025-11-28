/**
 * @fileoverview スレッド返信入力
 */

'use client';

import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type ThreadReplyInputProps = {
  parentMessageId: number;
  onSend: (content: string) => void;
  disabled?: boolean;
  className?: string;
};

export function ThreadReplyInput({
  parentMessageId,
  onSend,
  disabled,
  className,
}: ThreadReplyInputProps): React.ReactElement {
  const [value, setValue] = useState('');

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue('');
  }, [value, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className={cn('border-t bg-background p-3', className)}>
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="スレッドに返信..."
        className="resize-none"
        disabled={disabled}
        aria-label={`スレッド返信-${parentMessageId}`}
      />
      <div className="mt-2 flex justify-end">
        <Button onClick={handleSend} disabled={disabled || !value.trim()}>
          送信
        </Button>
      </div>
    </div>
  );
}
