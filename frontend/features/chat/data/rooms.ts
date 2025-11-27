/**
 * ルームデータ管理
 * MVP: ハードコードされたルーム一覧（将来的にはAPIから取得）
 */

import type { Room } from '@/types';

/**
 * モックルーム一覧
 */
export const MOCK_ROOMS: Room[] = [
  { id: 1, name: 'general' },
  { id: 2, name: 'random' },
  { id: 3, name: 'development' },
];

/**
 * ルームIDからルーム情報を取得
 * @param roomId - ルームID
 * @returns ルーム情報、見つからない場合は undefined
 */
export function getRoomById(roomId: number): Room | undefined {
  return MOCK_ROOMS.find((room) => room.id === roomId);
}

/**
 * ルームIDが有効かどうかをチェック
 * @param roomId - ルームID
 * @returns 有効な場合は true
 */
export function isValidRoomId(roomId: number): boolean {
  return MOCK_ROOMS.some((room) => room.id === roomId);
}
