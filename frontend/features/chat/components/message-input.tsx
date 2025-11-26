/**
 * メッセージ入力コンポーネント
 */

'use client';

import { useState, useCallback, type KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [content, setContent] = useState('');

  const handleSend = useCallback(() => {
    const trimmed = content.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setContent('');
    }
  }, [content, disabled, onSend]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-background border-t p-4">
      <div className="flex items-end gap-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="メッセージを入力..."
          disabled={disabled}
          className="max-h-[120px] min-h-[44px] resize-none"
          rows={1}
        />
        <Button
          onClick={handleSend}
          disabled={disabled || !content.trim()}
          size="icon"
          className="h-11 w-11 shrink-0"
        >
          <Send className="h-5 w-5" />
          <span className="sr-only">送信</span>
        </Button>
      </div>
      {disabled && (
        <p className="text-muted-foreground mt-2 text-xs">
          接続中... しばらくお待ちください
        </p>
      )}
    </div>
  );
}
