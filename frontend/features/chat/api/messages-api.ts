/**
 * @fileoverview メッセージ履歴 API クライアント
 * @description ルームのメッセージ履歴を取得する API 関数
 */

import { apiClient } from '@/lib/api-client';
import type {
  MessageHistoryResponse,
  GetMessagesOptions,
} from '@/types';

const DEFAULT_LIMIT = 50;

/**
 * ルームのメッセージ履歴を取得
 * @param roomId ルームID
 * @param options ページネーションオプション
 * @returns メッセージ履歴とページネーション情報
 */
export async function fetchRoomMessages(
  roomId: number,
  options: GetMessagesOptions = {},
): Promise<MessageHistoryResponse> {
  const { limit = DEFAULT_LIMIT, cursor, direction = 'older' } = options;

  const params: Record<string, string> = {
    limit: String(limit),
    direction,
  };

  if (cursor !== undefined) {
    params.cursor = String(cursor);
  }

  const response = await apiClient.get<MessageHistoryResponse>(
    `/chat/rooms/${roomId}/messages`,
    { params },
  );

  return response;
}
