/**
 * チャット関連の型定義
 */

export interface Message {
  id: number;
  roomId: number;
  userId: number;
  content: string;
  createdAt: string;
}

export interface Room {
  id: number;
  name: string;
}

/**
 * API から取得するチャットルーム（詳細情報付き）
 */
export interface ChatRoom {
  id: number;
  name: string;
  createdAt: string;
  createdByUserId: number;
}

export type ConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

/**
 * WebSocket イベントペイロード型
 */
export interface JoinRoomPayload {
  roomId: number;
}

export interface LeaveRoomPayload {
  roomId: number;
}

export interface SendMessagePayload {
  roomId: number;
  content: string;
}

export interface RoomJoinedPayload {
  roomId: number;
}

export interface RoomLeftPayload {
  roomId: number;
}

export interface MessageCreatedPayload {
  id: number;
  roomId: number;
  userId: number;
  content: string;
  createdAt: string;
}

export interface ErrorPayload {
  message: string;
  code?: string;
}
