/**
 * @fileoverview メッセージ入力コンポーネント
 * @description テキストエリアと送信ボタンを組み合わせたメッセージ入力フォーム
 * Enter キーでの送信、Shift+Enter での改行に対応
 */

'use client';

import { useState, useCallback, type KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

/** メッセージ入力の Props 型 */
type MessageInputProps = {
  /** メッセージ送信時に呼ばれるコールバック（トリム済みのコンテンツを渡す） */
  onSend: (content: string) => void;
  /** 入力を無効化するかどうか（接続中など） */
  disabled?: boolean;
};

/**
 * メッセージ入力コンポーネント
 * クライアントコンポーネントとして以下の機能を提供:
 * - テキストエリアでのメッセージ入力
 * - Enter キーで送信、Shift+Enter で改行
 * - 送信ボタンによるメッセージ送信
 * - disabled 時は入力・送信を無効化し、接続中メッセージを表示
 *
 * @param props - メッセージ入力用 props
 * @returns メッセージ入力フォームの JSX 要素
 */
export function MessageInput({ onSend, disabled }: MessageInputProps): React.JSX.Element {
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
