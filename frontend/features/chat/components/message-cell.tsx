/**
 * @fileoverview 左寄せメッセージ行（Slack ライク）
 */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { socketService } from '@/lib/socket';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { Check, MessageSquare, Pencil, Smile, Trash2, X } from 'lucide-react';
import { formatMessageTime, getAvatarInitials } from '../utils/message-utils';
import { MessageHoverToolbar } from './message-hover-toolbar';
import type { Message } from '@/types';

type MessageCellProps = {
  message: Message;
  currentUserId: number;
  onOpenThread?: (message: Message) => void;
  showThreadActions?: boolean;
};

export function MessageCell({
  message,
  currentUserId,
  onOpenThread,
  showThreadActions = true,
}: MessageCellProps): React.ReactElement {
  const isOwn = message.userId === currentUserId;
  const isThreadReply = Boolean(message.parentMessageId);
  const isPending = message.isPending ?? false;
  const isDeleted = message.isDeleted ?? false;
  const isEdited = message.isEdited ?? false;
  const reactions = message.reactions ?? [];
  const threadReplyCount = message.threadReplyCount ?? 0;

  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const username = useMemo(
    () => message.user?.username ?? message.username ?? 'Unknown',
    [message.user?.username, message.username],
  );

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(editContent.length, editContent.length);
    }
  }, [isEditing, editContent.length]);

  const handleToggleReaction = useCallback(
    (emoji: string) => {
      const existingReaction = reactions.find((r) => r.emoji === emoji);
      const hasUserReacted = existingReaction?.userIds.includes(currentUserId);

      if (hasUserReacted) {
        socketService.removeReaction(message.id, emoji);
      } else {
        socketService.addReaction(message.id, emoji);
      }
    },
    [message.id, reactions, currentUserId],
  );

  const handleEmojiSelect = useCallback(
    (emojiData: EmojiClickData) => {
      socketService.addReaction(message.id, emojiData.emoji);
      setShowEmojiPicker(false);
    },
    [message.id],
  );

  const handleStartEdit = useCallback(() => {
    setEditContent(message.content);
    setIsEditing(true);
  }, [message.content]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditContent(message.content);
  }, [message.content]);

  const handleConfirmEdit = useCallback(() => {
    const trimmedContent = editContent.trim();
    if (trimmedContent && trimmedContent !== message.content) {
      socketService.editMessage(message.id, trimmedContent);
    }
    setIsEditing(false);
  }, [editContent, message.id, message.content]);

  const handleDelete = useCallback(() => {
    if (confirm('このメッセージを削除しますか？')) {
      socketService.deleteMessage(message.id);
    }
  }, [message.id]);

  const handleOpenThread = useCallback(() => {
    if (onOpenThread) {
      onOpenThread(message);
    }
  }, [message, onOpenThread]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleConfirmEdit();
      } else if (e.key === 'Escape') {
        handleCancelEdit();
      }
    },
    [handleConfirmEdit, handleCancelEdit],
  );

  if (isDeleted) {
    return (
      <div className="flex items-start gap-3 px-2 py-1">
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className="text-xs">
            {getAvatarInitials(username, message.userId)}
          </AvatarFallback>
        </Avatar>
        <div className="text-muted-foreground text-sm">このメッセージは削除されました</div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group relative flex items-start gap-3 rounded-md px-2 py-1',
        isPending && 'opacity-60',
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarFallback className="text-xs">
          {getAvatarInitials(username, message.userId)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-medium leading-tight">{username}</span>
          {isOwn && <span className="text-primary text-xs">You</span>}
          <span className="text-muted-foreground text-xs">
            {formatMessageTime(message.createdAt)}
            {isEdited && ' (編集済み)'}
            {isPending && ' (送信中...)'}
          </span>
        </div>

        <div className="relative rounded-lg border bg-muted/50 px-3 py-2">
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                ref={textareaRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[60px] resize-none border-0 bg-transparent p-0 text-sm focus-visible:ring-0"
              />
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCancelEdit}>
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleConfirmEdit}
                  disabled={!editContent.trim()}
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
          )}

          {isHovered && !isEditing && !isPending && (
            <MessageHoverToolbar align="right">
              <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Smile className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent>リアクションを追加</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <PopoverContent className="w-auto p-0" align="start">
                  <EmojiPicker
                    onEmojiClick={handleEmojiSelect}
                    theme={Theme.AUTO}
                    width={300}
                    height={400}
                    searchPlaceholder="絵文字を検索..."
                    previewConfig={{ showPreview: false }}
                  />
                </PopoverContent>
              </Popover>

              {isOwn && (
                <>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleStartEdit}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>編集</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={handleDelete}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>削除</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              )}

              {!isThreadReply && showThreadActions && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleOpenThread}>
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>スレッドを開く</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </MessageHoverToolbar>
          )}
        </div>

        {reactions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {reactions.map((reaction) => {
              const hasUserReacted = reaction.userIds.includes(currentUserId);
              return (
                <button
                  key={reaction.emoji}
                  type="button"
                  onClick={() => handleToggleReaction(reaction.emoji)}
                  className={cn(
                    'flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors',
                    hasUserReacted
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <span>{reaction.emoji}</span>
                  <span className="text-muted-foreground">{reaction.count}</span>
                </button>
              );
            })}
          </div>
        )}

        {!isThreadReply && showThreadActions && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-primary"
              onClick={handleOpenThread}
            >
              <MessageSquare className="mr-1 h-4 w-4" />
              <span>返信 {threadReplyCount}</span>
            </Button>
            {message.threadLastRepliedAt && (
              <span className="text-muted-foreground text-xs">
                最終返信: {formatMessageTime(message.threadLastRepliedAt)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
