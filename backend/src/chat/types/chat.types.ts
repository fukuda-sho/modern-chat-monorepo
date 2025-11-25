/**
 * @fileoverview Chat 関連の型定義
 * @description WebSocket イベントのペイロード型を定義
 */

/**
 * WebSocket 接続時に格納されるユーザー情報
 */
export interface WsUser {
  /** ユーザー ID */
  userId: number;
  /** メールアドレス */
  email: string;
}

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
 * sendMessage イベントのペイロード
 */
export interface SendMessagePayload {
  /** 送信先ルームの ID */
  roomId: number;
  /** メッセージ内容 */
  content: string;
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
  /** メッセージ内容 */
  content: string;
  /** 作成日時（ISO 8601 形式） */
  createdAt: string;
}

/**
 * error イベントのペイロード
 */
export interface ErrorPayload {
  /** エラーメッセージ */
  message: string;
  /** エラーコード（オプション） */
  code?: string;
}
