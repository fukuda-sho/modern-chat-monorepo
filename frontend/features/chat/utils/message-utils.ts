/**
 * @fileoverview メッセージ関連ユーティリティ関数
 * @description メッセージの日付グループ化、フォーマット等のユーティリティ
 */

import type { Message, MessageListItem } from '@/types';

/**
 * メッセージを日付でグループ化し、日付区切りを挿入
 * @param messages メッセージ配列（時系列順）
 * @returns 日付区切り付きメッセージリスト
 */
export function groupMessagesByDate(messages: Message[]): MessageListItem[] {
  const result: MessageListItem[] = [];
  let currentDate: string | null = null;

  for (const message of messages) {
    const messageDate = new Date(message.createdAt).toDateString();

    if (messageDate !== currentDate) {
      currentDate = messageDate;
      result.push({
        type: 'date-separator',
        date: message.createdAt,
      });
    }

    result.push({
      type: 'message',
      data: message,
    });
  }

  return result;
}

/**
 * 日付区切りのフォーマット（「今日」「昨日」「2024年11月27日」など）
 * @param dateString ISO 8601 形式の日時文字列
 * @returns フォーマットされた日付文字列
 */
export function formatDateSeparator(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return '今日';
  }

  if (date.toDateString() === yesterday.toDateString()) {
    return '昨日';
  }

  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}

/**
 * メッセージ時刻のフォーマット（「10:30」形式）
 * @param dateString ISO 8601 形式の日時文字列
 * @returns HH:MM 形式の時刻文字列
 */
export function formatMessageTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * ユーザー名からアバターの頭文字を取得
 * @param username ユーザー名
 * @param userId ユーザー ID（フォールバック用）
 * @returns 頭文字（最大2文字）
 */
export function getAvatarInitials(username?: string, userId?: number): string {
  if (username) {
    // 日本語の場合は最初の1文字、英語の場合は最初の2文字
    return username.slice(0, 2).toUpperCase();
  }
  if (userId) {
    return userId.toString().slice(0, 2);
  }
  return '??';
}
