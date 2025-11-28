/**
 * チャットルーム API クライアント
 */

import { apiClient } from '@/lib/api-client';
import type { ChatRoom, ChannelMember, ChannelType } from '@/types/chat';

/** チャットルーム作成パラメータ */
export interface CreateChatRoomParams {
  name: string;
  description?: string;
  type?: ChannelType;
}

/**
 * ユーザーの参加チャンネル一覧を取得する
 * @returns 参加チャンネルの配列
 */
export async function fetchMyChannels(): Promise<ChatRoom[]> {
  return apiClient.get<ChatRoom[]>('/chat-rooms');
}

/**
 * 参加可能なチャンネル一覧を取得する（パブリックかつ未参加）
 * @returns 参加可能チャンネルの配列
 */
export async function fetchBrowseChannels(): Promise<ChatRoom[]> {
  return apiClient.get<ChatRoom[]>('/chat-rooms/browse');
}

/**
 * 指定 ID のチャットルームを取得する
 * @param id - ルーム ID
 * @returns チャットルーム（存在しない場合は 404 エラー）
 */
export async function fetchChatRoom(id: number): Promise<ChatRoom> {
  return apiClient.get<ChatRoom>(`/chat-rooms/${id}`);
}

/**
 * チャンネルのメンバー一覧を取得する
 * @param roomId - ルーム ID
 * @returns メンバーの配列
 */
export async function fetchChannelMembers(roomId: number): Promise<ChannelMember[]> {
  return apiClient.get<ChannelMember[]>(`/chat-rooms/${roomId}/members`);
}

/**
 * 新しいチャットルームを作成する
 * @param params - ルーム作成パラメータ
 * @returns 作成されたチャットルーム
 */
export async function createChatRoom(params: CreateChatRoomParams): Promise<ChatRoom> {
  return apiClient.post<ChatRoom>('/chat-rooms', params);
}

/**
 * パブリックチャンネルに参加する
 * @param roomId - ルーム ID
 * @returns 参加結果
 */
export async function joinChannel(roomId: number): Promise<void> {
  await apiClient.post(`/chat-rooms/${roomId}/join`);
}

/**
 * チャンネルから退出する
 * @param roomId - ルーム ID
 * @returns 退出結果
 */
export async function leaveChannel(roomId: number): Promise<void> {
  await apiClient.post(`/chat-rooms/${roomId}/leave`);
}

/**
 * チャンネルのスター状態を切り替える
 * @param roomId - ルーム ID
 * @returns 新しいスター状態
 */
export async function toggleChannelStar(roomId: number): Promise<{ isStarred: boolean }> {
  return apiClient.post<{ isStarred: boolean }>(`/chat-rooms/${roomId}/star`);
}

/**
 * メンバーをチャンネルに招待する
 * @param roomId - ルーム ID
 * @param userIds - 招待するユーザー ID の配列
 * @returns 招待結果
 */
export async function inviteMembers(
  roomId: number,
  userIds: number[],
): Promise<{ message: string; invitedCount: number }> {
  return apiClient.post(`/chat-rooms/${roomId}/invite`, { userIds });
}

/**
 * メンバーをチャンネルからキックする
 * @param roomId - ルーム ID
 * @param userId - キックするユーザー ID
 * @returns キック結果
 */
export async function kickMember(roomId: number, userId: number): Promise<void> {
  await apiClient.delete(`/chat-rooms/${roomId}/members/${userId}`);
}

// ========================================
// Legacy API（互換性のため残す）
// ========================================

/**
 * ルーム一覧を取得する
 * @deprecated fetchMyChannels を使用してください
 * @returns チャットルームの配列
 */
export async function fetchChatRooms(): Promise<ChatRoom[]> {
  return fetchMyChannels();
}
