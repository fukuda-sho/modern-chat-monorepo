import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ChatMessageProps {
  content: string;
  username: string;
  isOwnMessage: boolean;
  createdAt: string;
}

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
