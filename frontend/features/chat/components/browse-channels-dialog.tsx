/**
 * @fileoverview Browse Channels Dialog Component
 * @description 参加可能なチャンネルを検索・参加するダイアログ
 */

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Hash, Lock, Users, Search, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ChatRoom } from '@/types/chat';
import { useBrowseChannels, useJoinChannel } from '../hooks/use-channels';

/** BrowseChannelsDialog のプロップス */
interface BrowseChannelsDialogProps {
  /** ダイアログの開閉状態 */
  open: boolean;
  /** 開閉状態の変更ハンドラ */
  onOpenChange: (open: boolean) => void;
}

/**
 * チャンネルアイコンを返す
 */
function ChannelIcon({ type }: { type: ChatRoom['type'] }) {
  if (type === 'PRIVATE') {
    return <Lock className="h-5 w-5 text-muted-foreground" />;
  }
  return <Hash className="h-5 w-5 text-muted-foreground" />;
}

/**
 * チャンネルカードコンポーネント
 */
function ChannelCard({
  channel,
  onJoin,
  isJoining,
}: {
  channel: ChatRoom;
  onJoin: () => void;
  isJoining: boolean;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
      <ChannelIcon type={channel.type} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium truncate">{channel.name}</h4>
        </div>
        {channel.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
            {channel.description}
          </p>
        )}
        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
          <Users className="h-3 w-3" />
          <span>{channel.memberCount ?? 0} メンバー</span>
        </div>
      </div>
      <Button
        size="sm"
        onClick={onJoin}
        disabled={isJoining}
      >
        {isJoining ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          '参加'
        )}
      </Button>
    </div>
  );
}

/**
 * BrowseChannelsDialog コンポーネント
 * @description 参加可能なチャンネルを検索・参加するダイアログ
 */
export function BrowseChannelsDialog({
  open,
  onOpenChange,
}: BrowseChannelsDialogProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [joiningId, setJoiningId] = useState<number | null>(null);

  const { data: channels, isLoading, error } = useBrowseChannels();
  const { mutateAsync: joinChannel } = useJoinChannel();

  // 検索フィルタリング
  const filteredChannels = useMemo(() => {
    if (!channels) return [];
    if (!searchQuery.trim()) return channels;

    const query = searchQuery.toLowerCase();
    return channels.filter(
      (channel) =>
        channel.name.toLowerCase().includes(query) ||
        channel.description?.toLowerCase().includes(query),
    );
  }, [channels, searchQuery]);

  const handleJoin = async (channel: ChatRoom) => {
    setJoiningId(channel.id);
    try {
      await joinChannel(channel.id);
      onOpenChange(false);
      router.push(`/chat/${channel.id}`);
    } catch {
      // エラーは useJoinChannel 内で処理される
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>チャンネルを探す</DialogTitle>
          <DialogDescription>
            参加可能なパブリックチャンネルを検索して参加できます
          </DialogDescription>
        </DialogHeader>

        {/* 検索バー */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="チャンネル名で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* チャンネル一覧 */}
        <ScrollArea className="flex-1 min-h-[200px] max-h-[400px] -mx-6 px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              チャンネルの読み込みに失敗しました
            </div>
          ) : filteredChannels.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery
                ? '検索条件に一致するチャンネルがありません'
                : '参加可能なチャンネルがありません'}
            </div>
          ) : (
            <div className="space-y-2 py-2">
              {filteredChannels.map((channel) => (
                <ChannelCard
                  key={channel.id}
                  channel={channel}
                  onJoin={() => handleJoin(channel)}
                  isJoining={joiningId === channel.id}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
