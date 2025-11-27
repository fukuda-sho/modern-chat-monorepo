/**
 * チャットルーム API クライアント
 */

import { apiClient } from '@/lib/api-client';
import type { ChatRoom } from '../types';

/**
 * ルーム一覧を取得する
 * @returns チャットルームの配列
 */
export async function fetchChatRooms(): Promise<ChatRoom[]> {
  return apiClient.get<ChatRoom[]>('/chat-rooms');
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
 * 新しいチャットルームを作成する
 * @param name - ルーム名
 * @returns 作成されたチャットルーム
 */
export async function createChatRoom(name: string): Promise<ChatRoom> {
  return apiClient.post<ChatRoom>('/chat-rooms', { name });
}
