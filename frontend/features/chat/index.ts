/**
 * チャット機能のパブリック API
 */

// Components
export { ChatRoom } from './components/chat-room';
export { MessageList } from './components/message-list';
export { MessageItem } from './components/message-item';
export { MessageInput } from './components/message-input';
export { RoomList } from './components/room-list';
export { RoomItem } from './components/room-item';
export { RoomHeader } from './components/room-header';
export { EmptyRoom } from './components/empty-room';
export { ConnectionStatus } from './components/connection-status';

// Hooks
export { useChatSocket } from './hooks/use-chat-socket';
export { useMessages } from './hooks/use-messages';
export { useScrollToBottom } from './hooks/use-scroll-to-bottom';

// Store
export { useChatStore } from './store/chat-store';

// Data
export { MOCK_ROOMS, getRoomById, isValidRoomId } from './data/rooms';

// Types
export type {
  Message,
  Room,
  ConnectionStatus as ConnectionStatusType,
} from './types';
