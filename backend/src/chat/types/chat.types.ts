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
  /** 親メッセージ ID（スレッド返信の場合） */
  parentMessageId?: number | null;
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
  /** スレッド返信数 */
  threadReplyCount?: number;
  /** 最終返信日時 */
  threadLastRepliedAt?: string | null;
  /** 最終返信ユーザー */
  threadLastRepliedBy?: number | null;
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
  /** スレッド親メッセージ ID（スレッド操作時のみ） */
  parentMessageId?: number;
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
// メッセージ編集・削除
// ========================================

/**
 * editMessage イベントのペイロード
 */
export interface EditMessagePayload {
  /** 編集するメッセージの ID */
  messageId: number;
  /** 新しいメッセージ内容 */
  content: string;
}

/**
 * deleteMessage イベントのペイロード
 */
export interface DeleteMessagePayload {
  /** 削除するメッセージの ID */
  messageId: number;
}

/**
 * messageUpdated イベントのペイロード
 */
export interface MessageUpdatedPayload {
  /** メッセージ ID */
  id: number;
  /** ルーム ID */
  roomId: number;
  /** 新しいメッセージ内容 */
  content: string;
  /** 編集済みフラグ */
  isEdited: boolean;
  /** 編集日時（ISO 8601 形式） */
  editedAt: string;
}

/**
 * messageDeleted イベントのペイロード
 */
export interface MessageDeletedPayload {
  /** メッセージ ID */
  id: number;
  /** ルーム ID */
  roomId: number;
}

// ========================================
// リアクション関連
// ========================================

/**
 * addReaction イベントのペイロード
 */
export interface AddReactionPayload {
  /** リアクションを追加するメッセージの ID */
  messageId: number;
  /** 絵文字（Unicode または shortcode） */
  emoji: string;
}

/**
 * removeReaction イベントのペイロード
 */
export interface RemoveReactionPayload {
  /** リアクションを削除するメッセージの ID */
  messageId: number;
  /** 絵文字 */
  emoji: string;
}

/**
 * reactionAdded イベントのペイロード
 */
export interface ReactionAddedPayload {
  /** メッセージ ID */
  messageId: number;
  /** ルーム ID */
  roomId: number;
  /** 親メッセージ ID（スレッド返信の場合） */
  parentMessageId?: number | null;
  /** 絵文字 */
  emoji: string;
  /** ユーザー ID */
  userId: number;
  /** ユーザー名 */
  username: string;
}

/**
 * reactionRemoved イベントのペイロード
 */
export interface ReactionRemovedPayload {
  /** メッセージ ID */
  messageId: number;
  /** ルーム ID */
  roomId: number;
  /** 親メッセージ ID（スレッド返信の場合） */
  parentMessageId?: number | null;
  /** 絵文字 */
  emoji: string;
  /** ユーザー ID */
  userId: number;
}

// ========================================
// スレッド関連
// ========================================

/**
 * createThreadReply イベントのペイロード
 */
export interface CreateThreadReplyPayload {
  /** 親メッセージ ID */
  parentMessageId: number;
  /** 本文 */
  content: string;
  /** オプティミスティック更新用のローカル ID */
  localId?: string;
}

/**
 * スレッド返信追加ペイロード
 */
export interface ThreadReplyAddedPayload {
  /** 親メッセージ ID */
  parentMessageId: number;
  /** ルーム ID */
  roomId: number;
  /** 返信メッセージ */
  reply: {
    id: number;
    roomId: number;
    parentMessageId: number;
    userId: number;
    username: string;
    content: string;
    createdAt: string;
    localId?: string;
  };
}

/**
 * スレッド返信更新ペイロード
 */
export interface ThreadReplyUpdatedPayload {
  /** 親メッセージ ID */
  parentMessageId: number;
  /** ルーム ID */
  roomId: number;
  /** 返信メッセージ ID */
  replyId: number;
  /** 内容 */
  content: string;
  /** 編集フラグ */
  isEdited: boolean;
  /** 編集日時 */
  editedAt: string;
}

/**
 * スレッド返信削除ペイロード
 */
export interface ThreadReplyDeletedPayload {
  /** 親メッセージ ID */
  parentMessageId: number;
  /** ルーム ID */
  roomId: number;
  /** 返信メッセージ ID */
  replyId: number;
}

/**
 * スレッドサマリー更新ペイロード
 */
export interface ThreadSummaryUpdatedPayload {
  /** 親メッセージ ID */
  parentMessageId: number;
  /** ルーム ID */
  roomId: number;
  /** 返信数 */
  threadReplyCount: number;
  /** 最終返信日時 */
  threadLastRepliedAt: string | null;
  /** 最終返信ユーザー ID */
  threadLastRepliedBy: number | null;
  /** 最終返信ユーザー名（任意） */
  threadLastRepliedByUsername?: string;
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
  EDIT_MESSAGE: 'editMessage',
  DELETE_MESSAGE: 'deleteMessage',
  ADD_REACTION: 'addReaction',
  REMOVE_REACTION: 'removeReaction',
  CREATE_THREAD_REPLY: 'createThreadReply',
} as const;

/**
 * Server → Client イベント
 */
export const ServerEvents = {
  ROOM_JOINED: 'roomJoined',
  ROOM_LEFT: 'roomLeft',
  MESSAGE_CREATED: 'messageCreated',
  MESSAGE_UPDATED: 'messageUpdated',
  MESSAGE_DELETED: 'messageDeleted',
  REACTION_ADDED: 'reactionAdded',
  REACTION_REMOVED: 'reactionRemoved',
  ERROR: 'error',
  USER_ONLINE: 'userOnline',
  USER_OFFLINE: 'userOffline',
  ONLINE_USERS_LIST: 'onlineUsersList',
  USER_TYPING: 'userTyping',
  MEMBER_JOINED: 'memberJoined',
  MEMBER_LEFT: 'memberLeft',
  THREAD_REPLY_ADDED: 'threadReplyAdded',
  THREAD_REPLY_UPDATED: 'threadReplyUpdated',
  THREAD_REPLY_DELETED: 'threadReplyDeleted',
  THREAD_SUMMARY_UPDATED: 'threadSummaryUpdated',
} as const;
