/**
 * Entity type definitions
 * These types correspond to Prisma models
 */

export interface User {
  id: number;
  username: string;
  email: string;
  createdAt: Date | string;
}

export interface ChatRoom {
  id: number;
  name: string;
  createdAt: Date | string;
  users?: User[];
  messages?: Message[];
}

export interface Message {
  id: number;
  content: string;
  createdAt: Date | string;
  userId: number;
  user?: User;
  chatRoomId: number;
  chatRoom?: ChatRoom;
}
