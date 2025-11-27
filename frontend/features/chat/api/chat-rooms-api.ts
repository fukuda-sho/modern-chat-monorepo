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
 * 新しいチャットルームを作成する
 * @param name - ルーム名
 * @returns 作成されたチャットルーム
 */
export async function createChatRoom(name: string): Promise<ChatRoom> {
  return apiClient.post<ChatRoom>('/chat-rooms', { name });
}
