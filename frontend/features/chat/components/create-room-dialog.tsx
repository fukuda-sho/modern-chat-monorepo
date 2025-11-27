/**
 * @fileoverview 新規チャットルーム作成ダイアログ
 * @description ユーザーが新しいチャットルームを作成するためのモーダルダイアログ
 * TanStack Query の mutation でルーム作成 API を呼び出し、キャッシュを更新
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { createChatRoom } from '../api/chat-rooms-api';
import type { ChatRoom } from '../types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useMutationError } from '@/lib/errors';

/** チャットルーム一覧のクエリキー（キャッシュ管理用） */
export const CHAT_ROOMS_QUERY_KEY = ['chat-rooms'] as const;

/**
 * 新規チャットルーム作成ダイアログコンポーネント
 * クライアントコンポーネントとして以下の機能を提供:
 * - 「+」ボタンでダイアログを開く
 * - ルーム名入力フォーム
 * - 作成 API 呼び出しとエラーハンドリング
 * - 成功時はキャッシュ更新 + 新規ルームへ遷移
 *
 * @returns ルーム作成ダイアログの JSX 要素
 */
export function CreateRoomDialog(): React.JSX.Element {
  const [name, setName] = useState('');
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (roomName: string) => createChatRoom(roomName),
    onSuccess: (room) => {
      // ルーム一覧キャッシュを更新
      queryClient.setQueryData<ChatRoom[] | undefined>(
        CHAT_ROOMS_QUERY_KEY,
        (old) => (old ? [...old, room] : [room])
      );
      setName('');
      setOpen(false);
      router.push(`/chat/${room.id}`);
    },
  });

  const { errorMessage, resetError } = useMutationError(mutation);

  /**
   * フォーム送信ハンドラ
   * @param e - フォームイベント
   */
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    mutation.mutate(trimmed);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          setName('');
          resetError();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" aria-label="新規ルーム作成">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新しいルームを作成</DialogTitle>
          <DialogDescription>
            チャットルームの名前を入力してください
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMessage) {
                  resetError();
                }
              }}
              placeholder="general"
              aria-label="ルーム名"
            />
            <p className="text-xs text-muted-foreground">
              英数字、ハイフン、アンダースコアのみ使用可能
            </p>
            {errorMessage && (
              <p className="text-xs text-destructive">{errorMessage}</p>
            )}
          </div>
          <Button type="submit" disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? '作成中...' : '作成する'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
