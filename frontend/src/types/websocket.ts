/**
 * WebSocket event type definitions
 */

import type { Message, User } from './entity';

export interface JoinRoomPayload {
  roomId: number;
}

export interface LeaveRoomPayload {
  roomId: number;
}

export interface SendMessagePayload {
  content: string;
  chatRoomId: number;
}

export interface MessageReceivedPayload {
  id: number;
  content: string;
  createdAt: string;
  userId: number;
  user: User;
  chatRoomId: number;
}

export interface UserJoinedPayload {
  user: User;
  roomId: number;
}

export interface UserLeftPayload {
  userId: number;
  roomId: number;
}
