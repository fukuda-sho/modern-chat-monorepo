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
    })),
    { name: 'chat-store' }
  )
);
