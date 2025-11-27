/**
 * @fileoverview Chat 関連の型定義
 * @description WebSocket イベントのペイロード型を定義
 */

// ========================================
// ユーザー情報
// ========================================

/**
 * WebSocket 接続時に格納されるユーザー情報
 */
export interface WsUser {
  /** ユーザー ID */
  userId: number;
  /** メールアドレス */
  email: string;
  /** ユーザー名（オプション） */
  username?: string;
}

// ========================================
// ルーム参加・退出
// ========================================

/**
 * joinRoom イベントのペイロード
 */
export interface JoinRoomPayload {
  /** 参加するルームの ID */
  roomId: number;
}

/**
 * leaveRoom イベントのペイロード
 */
export interface LeaveRoomPayload {
  /** 退出するルームの ID */
  roomId: number;
}

/**
 * roomJoined イベントのペイロード
 */
export interface RoomJoinedPayload {
  /** 参加したルームの ID */
  roomId: number;
}

/**
 * roomLeft イベントのペイロード
 */
export interface RoomLeftPayload {
  /** 退出したルームの ID */
  roomId: number;
}

// ========================================
// メッセージ関連（localId 対応）
// ========================================

/**
 * sendMessage イベントのペイロード
 */
export interface SendMessagePayload {
  /** 送信先ルームの ID */
  roomId: number;
  /** メッセージ内容 */
  content: string;
  /** オプティミスティック更新用のローカル ID */
  localId?: string;
}

/**
 * messageCreated イベントのペイロード
 */
export interface MessageCreatedPayload {
  /** メッセージ ID */
  id: number;
  /** ルーム ID */
  roomId: number;
  /** 送信者のユーザー ID */
  userId: number;
  /** 送信者のユーザー名 */
  username: string;
  /** メッセージ内容 */
  content: string;
  /** 作成日時（ISO 8601 形式） */
  createdAt: string;
  /** オプティミスティック更新用のローカル ID */
  localId?: string;
}

/**
 * error イベントのペイロード
 */
export interface ErrorPayload {
  /** エラーメッセージ */
  message: string;
  /** エラーコード（オプション） */
  code?: string;
  /** オプティミスティック更新用のローカル ID */
  localId?: string;
}

// ========================================
// プレゼンス関連
// ========================================

/**
 * ユーザーオンライン通知ペイロード
 */
export interface UserOnlinePayload {
  /** オンラインになったユーザーの ID */
  userId: number;
  /** ユーザー名 */
  username: string;
}

/**
 * ユーザーオフライン通知ペイロード
 */
export interface UserOfflinePayload {
  /** オフラインになったユーザーの ID */
  userId: number;
}

/**
 * オンラインユーザー一覧要求ペイロード
 */
export interface GetOnlineUsersPayload {
  /** 指定した場合、そのルームのメンバーのみ返す */
  roomId?: number;
}

/**
 * オンラインユーザー一覧レスポンスペイロード
 */
export interface OnlineUsersListPayload {
  /** オンラインユーザーの ID 一覧 */
  userIds: number[];
}

// ========================================
// タイピング関連
// ========================================

/**
 * タイピング開始ペイロード
 */
export interface StartTypingPayload {
  /** タイピング中のルーム ID */
  roomId: number;
}

/**
 * タイピング終了ペイロード
 */
export interface StopTypingPayload {
  /** タイピング終了したルーム ID */
  roomId: number;
}

/**
 * タイピング状態通知ペイロード
 */
export interface UserTypingPayload {
  /** ルーム ID */
  roomId: number;
  /** タイピング中のユーザー ID */
  userId: number;
  /** ユーザー名 */
  username: string;
  /** タイピング中かどうか */
  isTyping: boolean;
}

// ========================================
// メンバーシップ関連
// ========================================

/**
 * メンバー参加通知ペイロード
 */
export interface MemberJoinedPayload {
  /** ルーム ID */
  roomId: number;
  /** 参加したユーザーの ID */
  userId: number;
  /** ユーザー名 */
  username: string;
}

/**
 * メンバー退出通知ペイロード
 */
export interface MemberLeftPayload {
  /** ルーム ID */
  roomId: number;
  /** 退出したユーザーの ID */
  userId: number;
  /** ユーザー名 */
  username: string;
  /** キックされた場合は true */
  kicked?: boolean;
}

// ========================================
// Socket イベント名定義
// ========================================

/**
 * Client → Server イベント
 */
export const ClientEvents = {
  JOIN_ROOM: 'joinRoom',
  LEAVE_ROOM: 'leaveRoom',
  SEND_MESSAGE: 'sendMessage',
  GET_ONLINE_USERS: 'getOnlineUsers',
  START_TYPING: 'startTyping',
  STOP_TYPING: 'stopTyping',
} as const;

/**
 * Server → Client イベント
 */
export const ServerEvents = {
  ROOM_JOINED: 'roomJoined',
  ROOM_LEFT: 'roomLeft',
  MESSAGE_CREATED: 'messageCreated',
  ERROR: 'error',
  USER_ONLINE: 'userOnline',
  USER_OFFLINE: 'userOffline',
  ONLINE_USERS_LIST: 'onlineUsersList',
  USER_TYPING: 'userTyping',
  MEMBER_JOINED: 'memberJoined',
  MEMBER_LEFT: 'memberLeft',
} as const;
