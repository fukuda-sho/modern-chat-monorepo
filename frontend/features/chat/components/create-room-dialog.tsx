/**
 * @fileoverview 新規チャットルーム作成ダイアログ
 * @description ユーザーが新しいチャットルームを作成するためのモーダルダイアログ
 * TanStack Query の mutation でルーム作成 API を呼び出し、キャッシュを更新
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useMutationError } from '@/lib/errors';
import { useCreateChannel, channelKeys } from '../hooks/use-channels';

/** チャットルーム一覧のクエリキー（キャッシュ管理用）- 後方互換性 */
export const CHAT_ROOMS_QUERY_KEY = channelKeys.myChannels();

/** CreateRoomDialog のプロップス */
interface CreateRoomDialogProps {
  /** 制御モード: ダイアログの開閉状態 */
  open?: boolean;
  /** 制御モード: 開閉状態の変更ハンドラ */
  onOpenChange?: (open: boolean) => void;
  /** トリガーを非表示にするかどうか */
  hideTrigger?: boolean;
}

/**
 * 新規チャットルーム作成ダイアログコンポーネント
 * クライアントコンポーネントとして以下の機能を提供:
 * - 「+」ボタンでダイアログを開く（制御モードでない場合）
 * - ルーム名入力フォーム
 * - 作成 API 呼び出しとエラーハンドリング
 * - 成功時はキャッシュ更新 + 新規ルームへ遷移
 *
 * @param props - ダイアログのプロップス
 * @returns ルーム作成ダイアログの JSX 要素
 */
export function CreateRoomDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  hideTrigger = false,
}: CreateRoomDialogProps = {}): React.JSX.Element {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [internalOpen, setInternalOpen] = useState(false);
  const router = useRouter();

  // 制御モードか非制御モードかを判定
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange ?? (() => {}) : setInternalOpen;

  const mutation = useCreateChannel();
  const { errorMessage, resetError } = useMutationError(mutation);

  /**
   * フォーム送信ハンドラ
   * @param e - フォームイベント
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    try {
      const room = await mutation.mutateAsync({
        name: trimmedName,
        description: description.trim() || undefined,
      });
      setName('');
      setDescription('');
      setOpen(false);
      router.push(`/chat/${room.id}`);
    } catch {
      // エラーは useMutationError で処理
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setName('');
      setDescription('');
      resetError();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!hideTrigger && !isControlled && (
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" aria-label="新規ルーム作成">
            <Plus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新しいチャンネルを作成</DialogTitle>
          <DialogDescription>
            チャンネルの名前と説明を入力してください
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="channel-name">チャンネル名</Label>
            <Input
              id="channel-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMessage) {
                  resetError();
                }
              }}
              placeholder="general"
              aria-label="チャンネル名"
            />
            <p className="text-xs text-muted-foreground">
              英数字、ハイフン、アンダースコアのみ使用可能
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="channel-description">説明（オプション）</Label>
            <Textarea
              id="channel-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="このチャンネルの目的を簡単に説明してください"
              rows={2}
            />
          </div>
          {errorMessage && (
            <p className="text-xs text-destructive">{errorMessage}</p>
          )}
          <Button type="submit" disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? '作成中...' : '作成する'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
