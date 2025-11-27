/**
 * チャット状態管理ストア
 * Zustand を使用したグローバル状態管理
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import type { Message, ConnectionStatus } from '@/types';

interface ChatState {
  // State
  messages: Map<number, Message[]>;
  connectionStatus: ConnectionStatus;
  currentRoomId: number | null;

  // Actions
  addMessage: (roomId: number, message: Message) => void;
  setMessages: (roomId: number, messages: Message[]) => void;
  clearMessages: (roomId: number) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setCurrentRoom: (roomId: number | null) => void;
  reset: () => void;

  // オプティミスティック更新用
  addOptimisticMessage: (roomId: number, message: Message) => void;
  confirmMessage: (
    roomId: number,
    localId: string,
    serverMessage: Message
  ) => void;
  failMessage: (roomId: number, localId: string) => void;
}

const initialState = {
  messages: new Map<number, Message[]>(),
  connectionStatus: 'disconnected' as ConnectionStatus,
  currentRoomId: null,
};

export const useChatStore = create<ChatState>()(
  devtools(
    subscribeWithSelector((set) => ({
      // Initial State
      ...initialState,

      // Actions
      addMessage: (roomId, message) =>
        set(
          (state) => {
            const newMessages = new Map(state.messages);
            const roomMessages = newMessages.get(roomId) || [];

            // 重複チェック（localId または id で）
            const isDuplicate = roomMessages.some(
              (msg) =>
                (message.localId && msg.localId === message.localId) ||
                (message.id > 0 && msg.id === message.id)
            );

            if (isDuplicate) {
              return state;
            }

            newMessages.set(roomId, [...roomMessages, message]);
            return { messages: newMessages };
          },
          false,
          'addMessage'
        ),

      setMessages: (roomId, messages) =>
        set(
          (state) => {
            const newMessages = new Map(state.messages);
            newMessages.set(roomId, messages);
            return { messages: newMessages };
          },
          false,
          'setMessages'
        ),

      clearMessages: (roomId) =>
        set(
          (state) => {
            const newMessages = new Map(state.messages);
            newMessages.delete(roomId);
            return { messages: newMessages };
          },
          false,
          'clearMessages'
        ),

      setConnectionStatus: (status) =>
        set({ connectionStatus: status }, false, 'setConnectionStatus'),

      setCurrentRoom: (roomId) =>
        set({ currentRoomId: roomId }, false, 'setCurrentRoom'),

      reset: () => set(initialState, false, 'reset'),

      // オプティミスティック更新用
      addOptimisticMessage: (roomId, message) =>
        set(
          (state) => {
            const newMessages = new Map(state.messages);
            const roomMessages = newMessages.get(roomId) || [];
            newMessages.set(roomId, [
              ...roomMessages,
              { ...message, isPending: true },
            ]);
            return { messages: newMessages };
          },
          false,
          'addOptimisticMessage'
        ),

      confirmMessage: (roomId, localId, serverMessage) =>
        set(
          (state) => {
            const newMessages = new Map(state.messages);
            const roomMessages = newMessages.get(roomId) || [];
            const updatedMessages = roomMessages.map((msg) =>
              msg.localId === localId
                ? { ...serverMessage, isPending: false }
                : msg
            );
            newMessages.set(roomId, updatedMessages);
            return { messages: newMessages };
          },
          false,
          'confirmMessage'
        ),

      failMessage: (roomId, localId) =>
        set(
          (state) => {
            const newMessages = new Map(state.messages);
            const roomMessages = newMessages.get(roomId) || [];
            // 失敗したメッセージを削除
            const updatedMessages = roomMessages.filter(
              (msg) => msg.localId !== localId
            );
            newMessages.set(roomId, updatedMessages);
            return { messages: newMessages };
          },
          false,
          'failMessage'
        ),
    })),
    { name: 'chat-store' }
  )
);
