/**
 * プレゼンス状態管理ストア
 * オンライン/オフライン状態とタイピング状態を管理
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface TypingUser {
  userId: number;
  username: string;
}

interface PresenceState {
  // State
  onlineUserIds: Set<number>;
  typingUsers: Map<number, TypingUser[]>; // roomId -> TypingUser[]

  // Actions
  setUserOnline: (userId: number) => void;
  setUserOffline: (userId: number) => void;
  setOnlineUsers: (userIds: number[]) => void;
  setUserTyping: (
    roomId: number,
    userId: number,
    username: string,
    isTyping: boolean
  ) => void;
  clearTypingForRoom: (roomId: number) => void;
  reset: () => void;
}

const initialState = {
  onlineUserIds: new Set<number>(),
  typingUsers: new Map<number, TypingUser[]>(),
};

export const usePresenceStore = create<PresenceState>()(
  devtools(
    (set) => ({
      ...initialState,

      setUserOnline: (userId) =>
        set(
          (state) => ({
            onlineUserIds: new Set([...state.onlineUserIds, userId]),
          }),
          false,
          'setUserOnline'
        ),

      setUserOffline: (userId) =>
        set(
          (state) => {
            const newSet = new Set(state.onlineUserIds);
            newSet.delete(userId);
            return { onlineUserIds: newSet };
          },
          false,
          'setUserOffline'
        ),

      setOnlineUsers: (userIds) =>
        set({ onlineUserIds: new Set(userIds) }, false, 'setOnlineUsers'),

      setUserTyping: (roomId, userId, username, isTyping) =>
        set(
          (state) => {
            const newTypingUsers = new Map(state.typingUsers);
            const roomTyping = newTypingUsers.get(roomId) || [];

            if (isTyping) {
              // 既に存在しなければ追加
              if (!roomTyping.some((u) => u.userId === userId)) {
                newTypingUsers.set(roomId, [
                  ...roomTyping,
                  { userId, username },
                ]);
              }
            } else {
              // 削除
              newTypingUsers.set(
                roomId,
                roomTyping.filter((u) => u.userId !== userId)
              );
            }

            return { typingUsers: newTypingUsers };
          },
          false,
          'setUserTyping'
        ),

      clearTypingForRoom: (roomId) =>
        set(
          (state) => {
            const newTypingUsers = new Map(state.typingUsers);
            newTypingUsers.delete(roomId);
            return { typingUsers: newTypingUsers };
          },
          false,
          'clearTypingForRoom'
        ),

      reset: () => set(initialState, false, 'reset'),
    }),
    { name: 'presence-store' }
  )
);
