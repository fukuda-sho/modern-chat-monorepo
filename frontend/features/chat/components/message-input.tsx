/**
 * @fileoverview メッセージ入力コンポーネント
 * @description テキストエリアと送信ボタンを組み合わせたメッセージ入力フォーム
 * Enter キーでの送信、Shift+Enter での改行に対応
 * タイピングイベントの送信にも対応
 */

'use client';

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  type KeyboardEvent,
  type ChangeEvent,
} from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { socketService } from '@/lib/socket';

/** タイピング停止までの非アクティブ時間（ミリ秒）- Slack ライクに 5 秒 */
const TYPING_STOP_DELAY_MS = 5000;

/** タイピングハートビート間隔（ミリ秒）- バックエンドのタイムアウトより短く */
const TYPING_HEARTBEAT_MS = 4000;

/** メッセージ入力の Props 型 */
type MessageInputProps = {
  /** ルーム ID */
  roomId: number;
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
 * - タイピングイベントの送信（デバウンス付き）
 * - disabled 時は入力・送信を無効化し、接続中メッセージを表示
 *
 * @param props - メッセージ入力用 props
 * @returns メッセージ入力フォームの JSX 要素
 */
export function MessageInput({
  roomId,
  onSend,
  disabled,
}: MessageInputProps): React.JSX.Element {
  const [content, setContent] = useState('');
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  /** 最後に startTyping を送信した時刻（ハートビート用） */
  const lastTypingSentRef = useRef<number>(0);

  /**
   * タイピング状態を開始し、ハートビートとデバウンスタイマーを管理
   * - 初回または TYPING_HEARTBEAT_MS 経過後に startTyping を送信
   * - これによりバックエンドのタイムアウトがリセットされ続ける
   */
  const handleTyping = useCallback(() => {
    const now = Date.now();

    // 初回、または前回送信から TYPING_HEARTBEAT_MS 経過していれば送信
    if (!isTypingRef.current || now - lastTypingSentRef.current >= TYPING_HEARTBEAT_MS) {
      isTypingRef.current = true;
      lastTypingSentRef.current = now;
      socketService.startTyping(roomId);
    }

    // 既存のタイムアウトをクリア
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // 指定時間後にタイピング終了
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        lastTypingSentRef.current = 0;
        socketService.stopTyping(roomId);
      }
    }, TYPING_STOP_DELAY_MS);
  }, [roomId]);

  /**
   * タイピング状態をクリア
   */
  const clearTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (isTypingRef.current) {
      isTypingRef.current = false;
      lastTypingSentRef.current = 0;
      socketService.stopTyping(roomId);
    }
  }, [roomId]);

  // コンポーネントアンマウント時 or roomId 変更時にクリーンアップ
  useEffect(() => {
    return () => {
      clearTyping();
    };
  }, [clearTyping]);

  /**
   * メッセージ送信処理
   */
  const handleSend = useCallback(() => {
    const trimmed = content.trim();
    if (trimmed && !disabled) {
      // タイピング状態をクリア
      clearTyping();

      onSend(trimmed);
      setContent('');
    }
  }, [content, disabled, onSend, clearTyping]);

  /**
   * テキストエリア変更ハンドラ
   */
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    setContent(e.target.value);
    // 入力がある場合のみタイピングイベントを送信
    if (e.target.value.trim()) {
      handleTyping();
    }
  };

  /**
   * キーダウンハンドラ
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /**
   * フォーカスアウトハンドラ（blur 時にタイピング状態を即座にクリア）
   */
  const handleBlur = (): void => {
    clearTyping();
  };

  return (
    <div className="bg-background border-t p-4">
      <div className="flex items-end gap-2">
        <Textarea
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
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
