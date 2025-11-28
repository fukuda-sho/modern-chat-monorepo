/**
 * @fileoverview 個別メッセージ表示コンポーネント
 * @description チャットメッセージを吹き出し形式で表示する
 * 自分のメッセージと他者のメッセージで配置・色を変える
 * メッセージ編集/削除、リアクション機能を提供
 */

'use client';

import { memo, useState, useCallback, useRef, useEffect } from 'react';
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
import { Pencil, Trash2, Smile, X, Check } from 'lucide-react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import type { Message } from '@/types';

/** メッセージアイテムの Props 型 */
type MessageItemProps = {
  /** 表示するメッセージオブジェクト */
  message: Message;
  /** 自分のメッセージかどうか（配置・色の制御に使用） */
  isOwn: boolean;
  /** 現在のユーザー ID */
  currentUserId: number;
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
 * ユーザー名からアバターの頭文字を取得
 * @param username - ユーザー名
 * @param userId - ユーザー ID（フォールバック用）
 * @returns 頭文字（最大2文字）
 */
function getAvatarInitials(username?: string, userId?: number): string {
  if (username) {
    // 日本語の場合は最初の1文字、英語の場合は最初の2文字
    return username.slice(0, 2).toUpperCase();
  }
  if (userId) {
    return userId.toString().slice(0, 2);
  }
  return '??';
}

/**
 * メッセージからユーザー名を取得
 * API からのメッセージは user.username、Socket.IO からは username がトップレベル
 * @param message - メッセージオブジェクト
 * @returns ユーザー名
 */
function getUsername(message: Message): string | undefined {
  return message.user?.username ?? message.username;
}

/**
 * メッセージアイテム内部コンポーネント
 * クライアントコンポーネントとして以下の機能を提供:
 * - 自分のメッセージは右寄せ、他者は左寄せで表示
 * - 他者のメッセージにはアバター（ユーザー名の頭文字）を表示
 * - メッセージ本文と送信時刻を吹き出し形式で表示
 * - 送信中（isPending）の場合は半透明で表示
 * - 自分のメッセージには編集・削除アクションを表示（ホバー時）
 * - リアクション追加・表示機能
 *
 * @param props - メッセージアイテム用 props
 * @returns メッセージアイテムの JSX 要素
 */
function MessageItemComponent({
  message,
  isOwn,
  currentUserId,
}: MessageItemProps): React.JSX.Element {
  const isPending = message.isPending ?? false;
  const isDeleted = message.isDeleted ?? false;
  const isEdited = message.isEdited ?? false;
  const username = getUsername(message);
  const reactions = message.reactions ?? [];

  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 編集モード開始時にテキストエリアにフォーカス
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        editContent.length,
        editContent.length
      );
    }
  }, [isEditing, editContent.length]);

  /**
   * 編集を開始
   */
  const handleStartEdit = useCallback(() => {
    setEditContent(message.content);
    setIsEditing(true);
  }, [message.content]);

  /**
   * 編集をキャンセル
   */
  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditContent(message.content);
  }, [message.content]);

  /**
   * 編集を確定
   */
  const handleConfirmEdit = useCallback(() => {
    const trimmedContent = editContent.trim();
    if (trimmedContent && trimmedContent !== message.content) {
      socketService.editMessage(message.id, trimmedContent);
    }
    setIsEditing(false);
  }, [editContent, message.id, message.content]);

  /**
   * メッセージを削除
   */
  const handleDelete = useCallback(() => {
    if (confirm('このメッセージを削除しますか？')) {
      socketService.deleteMessage(message.id);
    }
  }, [message.id]);

  /**
   * リアクションをトグル
   */
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
    [message.id, reactions, currentUserId]
  );

  /**
   * 絵文字ピッカーから絵文字を選択
   */
  const handleEmojiSelect = useCallback(
    (emojiData: EmojiClickData) => {
      socketService.addReaction(message.id, emojiData.emoji);
      setShowEmojiPicker(false);
    },
    [message.id]
  );

  /**
   * キーボードショートカット（編集時）
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleConfirmEdit();
      } else if (e.key === 'Escape') {
        handleCancelEdit();
      }
    },
    [handleConfirmEdit, handleCancelEdit]
  );

  // 削除されたメッセージの表示
  if (isDeleted) {
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
              {getAvatarInitials(username, message.userId)}
            </AvatarFallback>
          </Avatar>
        )}
        <div
          className={cn(
            'max-w-[70%] rounded-2xl px-4 py-2 italic',
            isOwn ? 'bg-muted/50 rounded-br-sm' : 'bg-muted/50 rounded-bl-sm'
          )}
        >
          <p className="text-muted-foreground text-sm">
            このメッセージは削除されました
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group flex items-end gap-2',
        isOwn ? 'flex-row-reverse' : 'flex-row',
        isPending && 'opacity-60'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {!isOwn && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="text-xs">
            {getAvatarInitials(username, message.userId)}
          </AvatarFallback>
        </Avatar>
      )}

      <div className={cn('relative max-w-[70%]', !isOwn && 'space-y-1')}>
        {/* 他者のメッセージにはユーザー名を表示 */}
        {!isOwn && username && (
          <span className="text-muted-foreground ml-1 text-xs">{username}</span>
        )}

        {/* アクションボタン（ホバー時に表示） */}
        {isHovered && !isEditing && !isPending && (
          <div
            className={cn(
              'absolute -top-8 flex items-center gap-1 rounded-md border bg-background p-1 shadow-sm',
              isOwn ? 'right-0' : 'left-0'
            )}
          >
            {/* 絵文字ピッカー */}
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

            {/* 自分のメッセージのみ編集・削除ボタンを表示 */}
            {isOwn && (
              <>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={handleStartEdit}
                      >
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
          </div>
        )}

        {/* メッセージ本文 */}
        <div
          className={cn(
            'rounded-2xl px-4 py-2',
            isOwn
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-muted rounded-bl-sm'
          )}
        >
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                ref={textareaRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className={cn(
                  'min-h-[60px] resize-none border-0 bg-transparent p-0 text-sm focus-visible:ring-0',
                  isOwn ? 'text-primary-foreground' : ''
                )}
              />
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleCancelEdit}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleConfirmEdit}
                  disabled={!editContent.trim()}
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="whitespace-pre-wrap break-words text-sm">
                {message.content}
              </p>
              <time
                className={cn(
                  'mt-1 block text-xs',
                  isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                )}
              >
                {formatMessageTime(message.createdAt)}
                {isEdited && ' (編集済み)'}
                {isPending && ' (送信中...)'}
              </time>
            </>
          )}
        </div>

        {/* リアクション表示 */}
        {reactions.length > 0 && !isEditing && (
          <div
            className={cn(
              'mt-1 flex flex-wrap gap-1',
              isOwn ? 'justify-end' : 'justify-start'
            )}
          >
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
      </div>
    </div>
  );
}

/**
 * メモ化されたメッセージアイテムコンポーネント
 * props が変更されない限り再レンダリングをスキップ
 */
export const MessageItem = memo(MessageItemComponent);
