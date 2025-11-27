/**
 * チャットルームコンポーネントのテスト
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { ChatRoom } from './chat-room';
import { useChatSocket } from '../hooks/use-chat-socket';
import { useChatStore } from '../store/chat-store';
import type { ConnectionStatus } from '@/types';

// useChatSocket フックのモック
vi.mock('../hooks/use-chat-socket', () => ({
  useChatSocket: vi.fn(),
}));

// useChatStore のモック
vi.mock('../store/chat-store', () => ({
  useChatStore: vi.fn(),
}));

// useCurrentUser フックのモック
vi.mock('@/features/auth', () => ({
  useCurrentUser: () => ({
    data: { id: 1, username: 'testuser', email: 'test@example.com' },
    isLoading: false,
  }),
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
  ) => {
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

    (useChatStore as Mock).mockImplementation((selector) => {
      const state = {
        messages: new Map([[1, messages]]),
        connectionStatus,
      };
      return selector(state);
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    setupMocks();
  });

  it('ルームヘッダーが表示される', () => {
    render(<ChatRoom roomId={1} roomName="general" />);

    // ルーム名が表示されることを確認
    expect(screen.getByText('general')).toBeInTheDocument();
  });

  it('roomName が指定されていない場合、Room {id} が表示される', () => {
    render(<ChatRoom roomId={1} />);

    expect(screen.getByText('Room 1')).toBeInTheDocument();
  });

  it('接続時に joinRoom が呼ばれる', () => {
    render(<ChatRoom roomId={1} />);

    expect(mockJoinRoom).toHaveBeenCalledWith(1);
  });

  it('未接続時には joinRoom が呼ばれない', () => {
    setupMocks({ isConnected: false, connectionStatus: 'disconnected' });

    render(<ChatRoom roomId={1} />);

    expect(mockJoinRoom).not.toHaveBeenCalled();
  });

  it('接続中のステータスが表示される', () => {
    setupMocks({ isConnected: false, connectionStatus: 'connecting' });

    render(<ChatRoom roomId={1} />);

    expect(screen.getByText('接続中...')).toBeInTheDocument();
  });

  it('接続エラーのステータスが表示される', () => {
    setupMocks({ isConnected: false, connectionStatus: 'error' });

    render(<ChatRoom roomId={1} />);

    expect(
      screen.getByText('接続エラーが発生しました。ページを再読み込みしてください。')
    ).toBeInTheDocument();
  });

  it('メッセージがない場合、空のメッセージ表示になる', () => {
    render(<ChatRoom roomId={1} />);

    expect(screen.getByText('メッセージはまだありません')).toBeInTheDocument();
  });

  it('メッセージ入力フィールドが表示される', () => {
    render(<ChatRoom roomId={1} />);

    expect(
      screen.getByPlaceholderText('メッセージを入力...')
    ).toBeInTheDocument();
  });

  it('未接続時はメッセージ入力が無効になる', () => {
    setupMocks({ isConnected: false, connectionStatus: 'disconnected' });

    render(<ChatRoom roomId={1} />);

    const textarea = screen.getByPlaceholderText('メッセージを入力...');
    expect(textarea).toBeDisabled();
  });

  it('接続時はメッセージ入力が有効になる', () => {
    setupMocks({ isConnected: true, connectionStatus: 'connected' });

    render(<ChatRoom roomId={1} />);

    const textarea = screen.getByPlaceholderText('メッセージを入力...');
    expect(textarea).not.toBeDisabled();
  });

  it('roomId が変わると leaveRoom と joinRoom が呼ばれる', () => {
    const { rerender } = render(<ChatRoom roomId={1} />);

    expect(mockJoinRoom).toHaveBeenCalledWith(1);

    rerender(<ChatRoom roomId={2} />);

    // 前のルームから退出
    expect(mockLeaveRoom).toHaveBeenCalledWith(1);
    // 新しいルームに参加
    expect(mockJoinRoom).toHaveBeenCalledWith(2);
  });
});
