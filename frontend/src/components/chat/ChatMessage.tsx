import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

/**
 * チャットメッセージコンポーネントのプロパティ
 */
interface ChatMessageProps {
  /** メッセージの本文 */
  content: string;
  /** 送信者のユーザー名 */
  username: string;
  /** 現在のユーザーが送信したメッセージかどうか（trueの場合、右寄せで表示） */
  isOwnMessage: boolean;
  /** メッセージの送信日時（ISO 8601形式） */
  createdAt: string;
}

/**
 * チャットメッセージを表示するコンポーネント
 *
 * 送信者のアバター、ユーザー名、メッセージ内容、送信時刻を表示します。
 * 自分が送信したメッセージは右寄せで青色、他のユーザーのメッセージは
 * 左寄せで灰色のスタイルが適用されます。
 *
 * ## デザイン
 * - 自分のメッセージ: 青色背景、右寄せ、右上角が直角
 * - 他人のメッセージ: 灰色背景、左寄せ、左上角が直角
 * - アバターはユーザー名の最初の文字を表示
 * - 送信時刻はローカルタイムゾーンで表示
 *
 * @example
 * ```tsx
 * <ChatMessage
 *   content="こんにちは！"
 *   username="山田太郎"
 *   isOwnMessage={false}
 *   createdAt="2024-01-01T12:00:00Z"
 * />
 * ```
 *
 * @param props - コンポーネントのプロパティ
 */
export function ChatMessage({
  content,
  username,
  isOwnMessage,
  createdAt,
}: ChatMessageProps) {
  return (
    <div
      className={cn(
        'flex w-full gap-2 p-2',
        isOwnMessage ? 'flex-row-reverse' : 'flex-row'
      )}
      data-testid='chat-message-container'>
      <Avatar className='h-8 w-8'>
        <AvatarFallback>{username[0]}</AvatarFallback>
      </Avatar>
      <div
        className={cn(
          'max-w-[70%] rounded-lg p-3 text-sm',
          isOwnMessage
            ? 'bg-blue-500 text-white rounded-tr-none'
            : 'bg-gray-200 text-gray-900 rounded-tl-none'
        )}>
        <div className='flex items-center justify-between gap-2 mb-1'>
          <span className='font-bold text-xs opacity-90'>{username}</span>
          <span className='text-xs opacity-70'>
            {new Date(createdAt).toLocaleTimeString()}
          </span>
        </div>
        <p>{content}</p>
      </div>
    </div>
  );
}
