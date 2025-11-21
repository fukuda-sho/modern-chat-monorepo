/**
 * API Request and Response type definitions
 */

import type { User, ChatRoom, Message } from './entity';

// Auth API Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
}

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  createdAt: string;
}

// Chat API Types
export interface CreateMessageRequest {
  content: string;
  chatRoomId: number;
}

export interface MessageResponse extends Message {
  user: User;
}

export interface ChatRoomResponse extends ChatRoom {
  users: User[];
  messages?: MessageResponse[];
}

// Error Response
export interface ApiError {
  message: string | string[];
  statusCode: number;
  error?: string;
}
