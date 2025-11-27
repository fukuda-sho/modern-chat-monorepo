/**
 * プレゼンス関連のカスタムフック
 */

import { usePresenceStore } from '../store/presence-store';

/** タイピングユーザーが空の場合に返す安定した参照 */
const EMPTY_TYPING_USERS: { userId: number; username: string }[] = [];

/**
 * 指定ユーザーがオンラインかどうかを取得
 * @param userId - ユーザー ID
 * @returns オンラインなら true
 */
export function useIsUserOnline(userId: number): boolean {
  return usePresenceStore((state) => state.onlineUserIds.has(userId));
}

/**
 * 指定ルームでタイピング中のユーザー一覧を取得
 * @param roomId - ルーム ID
 * @returns タイピング中のユーザー一覧
 */
export function useTypingUsers(
  roomId: number
): { userId: number; username: string }[] {
  return usePresenceStore(
    (state) => state.typingUsers.get(roomId) ?? EMPTY_TYPING_USERS
  );
}

/**
 * オンラインユーザー ID の Set を取得
 * @returns オンラインユーザー ID の Set
 */
export function useOnlineUserIds(): Set<number> {
  return usePresenceStore((state) => state.onlineUserIds);
}
