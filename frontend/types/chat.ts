/**
 * チャット関連の型定義
 */

export interface Message {
  id: number;
  roomId: number;
  userId: number;
  username?: string;
  content: string;
  createdAt: string;
  localId?: string;
  isPending?: boolean;
}

export interface Room {
  id: number;
  name: string;
}

// ========================================
// チャンネル関連
// ========================================

/**
 * チャンネルタイプ
 */
export type ChannelType = 'PUBLIC' | 'PRIVATE' | 'DM';

/**
 * メンバーの役割
 */
export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

/**
 * チャンネルメンバーシップ情報
 */
export interface ChannelMembership {
  role: MemberRole;
  isStarred: boolean;
}

/**
 * API から取得するチャットルーム（詳細情報付き）
 */
export interface ChatRoom {
  id: number;
  name: string;
  createdAt: string;
  createdByUserId: number | null;
  type: ChannelType;
  description?: string | null;
  membership?: ChannelMembership | null;
  memberCount?: number;
}

/**
 * チャンネルメンバー情報
 */
export interface ChannelMember {
  id: number;
  userId: number;
  chatRoomId: number;
  role: MemberRole;
  isStarred: boolean;
  joinedAt: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

export type ConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

// ========================================
// ルーム関連
// ========================================

export interface JoinRoomPayload {
  roomId: number;
}

export interface LeaveRoomPayload {
  roomId: number;
}

export interface RoomJoinedPayload {
  roomId: number;
}

export interface RoomLeftPayload {
  roomId: number;
}

// ========================================
// メッセージ関連（localId 対応）
// ========================================

export interface SendMessagePayload {
  roomId: number;
  content: string;
  localId?: string;
}

export interface MessageCreatedPayload {
  id: number;
  roomId: number;
  userId: number;
  username: string;
  content: string;
  createdAt: string;
  localId?: string;
}

export interface ErrorPayload {
  message: string;
  code?: string;
  localId?: string;
}

// ========================================
// プレゼンス関連
// ========================================

/**
 * ユーザーオンライン通知ペイロード
 */
export interface UserOnlinePayload {
  userId: number;
  username: string;
}

/**
 * ユーザーオフライン通知ペイロード
 */
export interface UserOfflinePayload {
  userId: number;
}

/**
 * オンラインユーザー一覧要求ペイロード
 */
export interface GetOnlineUsersPayload {
  roomId?: number;
}

/**
 * オンラインユーザー一覧レスポンスペイロード
 */
export interface OnlineUsersListPayload {
  userIds: number[];
}

// ========================================
// タイピング関連
// ========================================

/**
 * タイピング開始ペイロード
 */
export interface StartTypingPayload {
  roomId: number;
}

/**
 * タイピング終了ペイロード
 */
export interface StopTypingPayload {
  roomId: number;
}

/**
 * タイピング状態通知ペイロード
 */
export interface UserTypingPayload {
  roomId: number;
  userId: number;
  username: string;
  isTyping: boolean;
}
