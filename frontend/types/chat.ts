/**
 * チャット関連の型定義
 */

/**
 * メッセージに含まれるユーザー情報（API レスポンス用）
 */
export interface MessageUser {
  id: number;
  username: string;
  email: string;
}

/**
 * リアクション集計情報
 */
export interface ReactionSummary {
  emoji: string;
  count: number;
  userIds: number[];
}

export interface Message {
  id: number;
  roomId: number;
  userId: number;
  username?: string;
  content: string;
  createdAt: string;
  localId?: string;
  isPending?: boolean;
  /** API から取得したメッセージに含まれるユーザー情報 */
  user?: MessageUser;
  /** 編集済みフラグ */
  isEdited?: boolean;
  /** 編集日時（ISO 8601 形式） */
  editedAt?: string | null;
  /** 削除済みフラグ */
  isDeleted?: boolean;
  /** リアクション一覧 */
  reactions?: ReactionSummary[];
}

// ========================================
// メッセージ履歴 API 関連
// ========================================

/**
 * ページネーション情報（カーソルベース）
 */
export interface MessagePagination {
  hasMore: boolean;
  nextCursor: number | null;
  prevCursor: number | null;
}

/**
 * メッセージ履歴 API レスポンス
 */
export interface MessageHistoryResponse {
  data: Message[];
  pagination: MessagePagination;
}

/**
 * メッセージ取得オプション
 */
export interface GetMessagesOptions {
  limit?: number;
  cursor?: number;
  direction?: 'older' | 'newer';
}

/**
 * 日付区切り付きメッセージアイテム（UI 表示用）
 */
export type MessageListItem =
  | { type: 'message'; data: Message }
  | { type: 'date-separator'; date: string };

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
// メッセージ編集・削除関連
// ========================================

/**
 * メッセージ編集リクエストペイロード
 */
export interface EditMessagePayload {
  messageId: number;
  content: string;
}

/**
 * メッセージ削除リクエストペイロード
 */
export interface DeleteMessagePayload {
  messageId: number;
}

/**
 * メッセージ更新イベントペイロード（サーバーから）
 */
export interface MessageUpdatedPayload {
  id: number;
  roomId: number;
  content: string;
  isEdited: boolean;
  editedAt: string;
}

/**
 * メッセージ削除イベントペイロード（サーバーから）
 */
export interface MessageDeletedPayload {
  id: number;
  roomId: number;
}

// ========================================
// リアクション関連
// ========================================

/**
 * リアクション追加リクエストペイロード
 */
export interface AddReactionPayload {
  messageId: number;
  emoji: string;
}

/**
 * リアクション削除リクエストペイロード
 */
export interface RemoveReactionPayload {
  messageId: number;
  emoji: string;
}

/**
 * リアクション追加イベントペイロード（サーバーから）
 */
export interface ReactionAddedPayload {
  messageId: number;
  roomId: number;
  emoji: string;
  userId: number;
  username: string;
}

/**
 * リアクション削除イベントペイロード（サーバーから）
 */
export interface ReactionRemovedPayload {
  messageId: number;
  roomId: number;
  emoji: string;
  userId: number;
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
