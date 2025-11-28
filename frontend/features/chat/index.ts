/**
 * チャット機能のパブリック API
 */

// Components
export { ChatRoom } from './components/chat-room';
export { MessageList } from './components/message-list';
export { MessageCell } from './components/message-cell';
export { MessageInput } from './components/message-input';
export { RoomList } from './components/room-list';
export { RoomItem } from './components/room-item';
export { RoomHeader } from './components/room-header';
export { EmptyRoom } from './components/empty-room';
export { ConnectionStatus } from './components/connection-status';
export {
  CreateRoomDialog,
  CHAT_ROOMS_QUERY_KEY,
} from './components/create-room-dialog';
export { SidebarAccordion } from './components/sidebar-accordion';
export { SidebarSection } from './components/sidebar-section';
export { ChannelItem } from './components/channel-item';
export { BrowseChannelsDialog } from './components/browse-channels-dialog';
export { DateSeparator } from './components/date-separator';
export { LoadMoreTrigger } from './components/load-more-trigger';

// Hooks
export { useChatSocket } from './hooks/use-chat-socket';
export { useMessages } from './hooks/use-messages';
export { useScrollToBottom } from './hooks/use-scroll-to-bottom';
export {
  useRoomMessages,
  useMessageCacheUpdater,
  roomMessagesKeys,
} from './hooks/use-room-messages';
export {
  useThreadMessages,
  useThreadCacheUpdater,
  threadMessagesKeys,
} from './hooks/use-thread-messages';
export {
  useMyChannels,
  useStarredChannels,
  useBrowseChannels,
  useChannel,
  useChannelMembers,
  useJoinChannel,
  useLeaveChannel,
  useToggleStar,
  useCreateChannel,
  useCategorizedChannels,
  channelKeys,
} from './hooks/use-channels';

// Store
export { useChatStore } from './store/chat-store';
export {
  useSidebarStore,
  type SidebarSection as SidebarSectionType,
} from './store/sidebar-store';

// API
export {
  fetchChatRooms,
  fetchChatRoom,
  createChatRoom,
  fetchMyChannels,
  fetchBrowseChannels,
  fetchChannelMembers,
  joinChannel,
  leaveChannel,
  toggleChannelStar,
  inviteMembers,
  kickMember,
} from './api/chat-rooms-api';
export { fetchRoomMessages, fetchThreadMessages, postThreadReply } from './api/messages-api';

// Utils
export {
  groupMessagesByDate,
  formatDateSeparator,
  formatMessageTime,
  getAvatarInitials,
} from './utils/message-utils';

// Types
export type {
  Message,
  Room,
  ChatRoom as ChatRoomType,
  ConnectionStatus as ConnectionStatusType,
} from './types';
