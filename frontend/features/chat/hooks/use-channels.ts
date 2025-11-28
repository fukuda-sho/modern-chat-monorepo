/**
 * @fileoverview Channel Hooks
 * @description チャンネル関連の TanStack Query フック
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ChatRoom } from '@/types/chat';
import {
  fetchMyChannels,
  fetchBrowseChannels,
  fetchChatRoom,
  fetchChannelMembers,
  joinChannel,
  leaveChannel,
  toggleChannelStar,
  CreateChatRoomParams,
  createChatRoom,
} from '../api/chat-rooms-api';

/** チャンネル関連のクエリキー */
export const channelKeys = {
  all: ['channels'] as const,
  myChannels: () => [...channelKeys.all, 'my'] as const,
  browseChannels: () => [...channelKeys.all, 'browse'] as const,
  detail: (id: number) => [...channelKeys.all, 'detail', id] as const,
  members: (id: number) => [...channelKeys.all, 'members', id] as const,
};

/**
 * ユーザーの参加チャンネル一覧を取得するフック
 */
export function useMyChannels() {
  return useQuery({
    queryKey: channelKeys.myChannels(),
    queryFn: fetchMyChannels,
    staleTime: 30 * 1000, // 30秒
  });
}

/**
 * スターされたチャンネル一覧を取得するフック
 */
export function useStarredChannels() {
  const { data: channels, ...rest } = useMyChannels();

  const starredChannels = channels?.filter(
    (channel) => channel.membership?.isStarred,
  );

  return {
    ...rest,
    data: starredChannels,
  };
}

/**
 * 参加可能なチャンネル一覧を取得するフック
 */
export function useBrowseChannels() {
  return useQuery({
    queryKey: channelKeys.browseChannels(),
    queryFn: fetchBrowseChannels,
    staleTime: 30 * 1000,
  });
}

/**
 * 指定 ID のチャンネル詳細を取得するフック
 * @param roomId - ルーム ID
 */
export function useChannel(roomId: number) {
  return useQuery({
    queryKey: channelKeys.detail(roomId),
    queryFn: () => fetchChatRoom(roomId),
    enabled: roomId > 0,
  });
}

/**
 * チャンネルのメンバー一覧を取得するフック
 * @param roomId - ルーム ID
 */
export function useChannelMembers(roomId: number) {
  return useQuery({
    queryKey: channelKeys.members(roomId),
    queryFn: () => fetchChannelMembers(roomId),
    enabled: roomId > 0,
  });
}

/**
 * チャンネルに参加するミューテーションフック
 */
export function useJoinChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: joinChannel,
    onSuccess: () => {
      // 参加チャンネル一覧と参加可能チャンネル一覧を再取得
      queryClient.invalidateQueries({ queryKey: channelKeys.myChannels() });
      queryClient.invalidateQueries({ queryKey: channelKeys.browseChannels() });
    },
  });
}

/**
 * チャンネルから退出するミューテーションフック
 */
export function useLeaveChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: leaveChannel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: channelKeys.myChannels() });
      queryClient.invalidateQueries({ queryKey: channelKeys.browseChannels() });
    },
  });
}

/**
 * チャンネルのスター状態を切り替えるミューテーションフック
 */
export function useToggleStar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleChannelStar,
    onMutate: async (roomId) => {
      // オプティミスティック更新
      await queryClient.cancelQueries({ queryKey: channelKeys.myChannels() });
      const previousChannels = queryClient.getQueryData<ChatRoom[]>(
        channelKeys.myChannels(),
      );

      if (previousChannels) {
        queryClient.setQueryData<ChatRoom[]>(
          channelKeys.myChannels(),
          previousChannels.map((channel) =>
            channel.id === roomId
              ? {
                  ...channel,
                  membership: channel.membership
                    ? { ...channel.membership, isStarred: !channel.membership.isStarred }
                    : { role: 'MEMBER' as const, isStarred: true },
                }
              : channel,
          ),
        );
      }

      return { previousChannels };
    },
    onError: (_, __, context) => {
      // エラー時はロールバック
      if (context?.previousChannels) {
        queryClient.setQueryData(channelKeys.myChannels(), context.previousChannels);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: channelKeys.myChannels() });
    },
  });
}

/**
 * 新しいチャンネルを作成するミューテーションフック
 */
export function useCreateChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateChatRoomParams) => createChatRoom(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: channelKeys.myChannels() });
      queryClient.invalidateQueries({ queryKey: channelKeys.browseChannels() });
    },
  });
}

/**
 * チャンネル一覧を分類して返すユーティリティフック
 */
export function useCategorizedChannels() {
  const { data: channels, isLoading, error } = useMyChannels();

  const starred = channels?.filter((c) => c.membership?.isStarred) ?? [];
  const publicChannels = channels?.filter(
    (c) => c.type === 'PUBLIC' && !c.membership?.isStarred,
  ) ?? [];
  const privateChannels = channels?.filter(
    (c) => c.type === 'PRIVATE' && !c.membership?.isStarred,
  ) ?? [];
  const dms = channels?.filter((c) => c.type === 'DM') ?? [];

  return {
    isLoading,
    error,
    starred,
    channels: [...publicChannels, ...privateChannels],
    dms,
  };
}
