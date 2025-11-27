/**
 * チャットルームコンポーネントのテスト
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChatRoom } from './chat-room';
import { useChatSocket } from '../hooks/use-chat-socket';
import { useChatStore } from '../store/chat-store';
import type { ConnectionStatus } from '@/types';

/** テスト用のルームデータ */
const TEST_ROOM = { id: 1, name: 'general', createdAt: '2024-01-01T00:00:00.000Z' };

// useChatSocket フックのモック
vi.mock('../hooks/use-chat-socket', () => ({
  useChatSocket: vi.fn(),
}));

// useChatStore のモック
vi.mock('../store/chat-store', () => ({
  useChatStore: vi.fn(),
}));

// usePresenceStore のモック
vi.mock('@/features/presence/store/presence-store', () => ({
  usePresenceStore: vi.fn(() => new Map()),
}));

// useCurrentUser フックのモック
vi.mock('@/features/auth', () => ({
  useCurrentUser: () => ({
    data: { id: 1, username: 'testuser', email: 'test@example.com' },
    isLoading: false,
  }),
}));

// useTypingUsers フックのモック
vi.mock('@/features/presence/hooks/use-presence', () => ({
  useTypingUsers: () => [],
}));

// next/link のモック
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

// socketService のモック
vi.mock('@/lib/socket', () => ({
  socketService: {
    startTyping: vi.fn(),
    stopTyping: vi.fn(),
  },
}));

// API のモック
const mockFetchChatRoom = vi.fn();
vi.mock('../api/chat-rooms-api', () => ({
  fetchChatRoom: (id: number) => mockFetchChatRoom(id),
}));

/**
 * テスト用のラッパーコンポーネント
 */
function createTestWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return TestWrapper;
}

describe('ChatRoom', () => {
  const mockJoinRoom = vi.fn();
  const mockLeaveRoom = vi.fn();
  const mockSendMessage = vi.fn();

  const setupMocks = (
    overrides: {
      isConnected?: boolean;
      connectionStatus?: ConnectionStatus;
      messages?: never[];
    } = {}
  ): void => {
    const {
      isConnected = true,
      connectionStatus = 'connected',
      messages = [],
    } = overrides;

    (useChatSocket as Mock).mockReturnValue({
      joinRoom: mockJoinRoom,
      leaveRoom: mockLeaveRoom,
      sendMessage: mockSendMessage,
      isConnected,
      connectionStatus,
    });

    (useChatStore as unknown as Mock).mockImplementation(
      (selector: (state: { messages: Map<number, never[]>; connectionStatus: ConnectionStatus }) => unknown) => {
        const state = {
          messages: new Map([[1, messages]]),
          connectionStatus,
        };
        return selector(state);
      }
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    setupMocks();
    // デフォルトではルーム取得成功
    mockFetchChatRoom.mockResolvedValue(TEST_ROOM);
  });

  it('読み込み中は「読み込み中...」が表示される', () => {
    // API を遅延させる
    mockFetchChatRoom.mockImplementation(
      () => new Promise(() => {}) // never resolves
    );

    render(<ChatRoom roomId={1} />, { wrapper: createTestWrapper() });

    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('ルームヘッダーが表示される', async () => {
    render(<ChatRoom roomId={1} />, { wrapper: createTestWrapper() });

    // ルーム名が表示されることを確認
    expect(await screen.findByText('general')).toBeInTheDocument();
  });

  it('ルームが見つからない場合はエラーメッセージが表示される', async () => {
    mockFetchChatRoom.mockRejectedValue(new Error('Not Found'));

    render(<ChatRoom roomId={999} />, { wrapper: createTestWrapper() });

    expect(
      await screen.findByText('チャンネルが見つかりません（ID: 999）')
    ).toBeInTheDocument();
  });

  it('接続時に joinRoom が呼ばれる', async () => {
    render(<ChatRoom roomId={1} />, { wrapper: createTestWrapper() });

    // ルーム読み込み完了を待つ
    await screen.findByText('general');

    expect(mockJoinRoom).toHaveBeenCalledWith(1);
  });

  it('未接続時には joinRoom が呼ばれない', async () => {
    setupMocks({ isConnected: false, connectionStatus: 'disconnected' });

    render(<ChatRoom roomId={1} />, { wrapper: createTestWrapper() });

    // ルーム読み込み完了を待つ
    await screen.findByText('general');

    expect(mockJoinRoom).not.toHaveBeenCalled();
  });

  it('接続中のステータスが表示される', async () => {
    setupMocks({ isConnected: false, connectionStatus: 'connecting' });

    render(<ChatRoom roomId={1} />, { wrapper: createTestWrapper() });

    // ルーム読み込み完了を待つ
    await screen.findByText('general');

    expect(screen.getByText('接続中...')).toBeInTheDocument();
  });

  it('接続エラーのステータスが表示される', async () => {
    setupMocks({ isConnected: false, connectionStatus: 'error' });

    render(<ChatRoom roomId={1} />, { wrapper: createTestWrapper() });

    // ルーム読み込み完了を待つ
    await screen.findByText('general');

    expect(
      screen.getByText('接続エラーが発生しました。ページを再読み込みしてください。')
    ).toBeInTheDocument();
  });

  it('メッセージがない場合、空のメッセージ表示になる', async () => {
    render(<ChatRoom roomId={1} />, { wrapper: createTestWrapper() });

    // ルーム読み込み完了を待つ
    await screen.findByText('general');

    expect(screen.getByText('メッセージはまだありません')).toBeInTheDocument();
  });

  it('メッセージ入力フィールドが表示される', async () => {
    render(<ChatRoom roomId={1} />, { wrapper: createTestWrapper() });

    // ルーム読み込み完了を待つ
    await screen.findByText('general');

    expect(
      screen.getByPlaceholderText('メッセージを入力...')
    ).toBeInTheDocument();
  });

  it('未接続時はメッセージ入力が無効になる', async () => {
    setupMocks({ isConnected: false, connectionStatus: 'disconnected' });

    render(<ChatRoom roomId={1} />, { wrapper: createTestWrapper() });

    // ルーム読み込み完了を待つ
    await screen.findByText('general');

    const textarea = screen.getByPlaceholderText('メッセージを入力...');
    expect(textarea).toBeDisabled();
  });

  it('接続時はメッセージ入力が有効になる', async () => {
    setupMocks({ isConnected: true, connectionStatus: 'connected' });

    render(<ChatRoom roomId={1} />, { wrapper: createTestWrapper() });

    // ルーム読み込み完了を待つ
    await screen.findByText('general');

    const textarea = screen.getByPlaceholderText('メッセージを入力...');
    expect(textarea).not.toBeDisabled();
  });
});
