/**
 * 新規チャットルーム作成ダイアログのテスト
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CreateRoomDialog, CHAT_ROOMS_QUERY_KEY } from './create-room-dialog';
import type { ChatRoom } from '../types';

// next/navigation のモック
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

// API のモック
const mockCreateChatRoom = vi.fn();
vi.mock('../api/chat-rooms-api', () => ({
  createChatRoom: (params: { name: string; description?: string }) =>
    mockCreateChatRoom(params),
}));

/**
 * テスト用のラッパーコンポーネント
 * QueryClientProvider を提供する
 */
function createTestWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return {
    queryClient,
    Wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

describe('CreateRoomDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('トリガーボタンが表示される', () => {
    const { Wrapper } = createTestWrapper();
    render(<CreateRoomDialog />, { wrapper: Wrapper });

    expect(
      screen.getByRole('button', { name: '新規ルーム作成' })
    ).toBeInTheDocument();
  });

  it('ボタンクリックでダイアログが開く', async () => {
    const user = userEvent.setup();
    const { Wrapper } = createTestWrapper();
    render(<CreateRoomDialog />, { wrapper: Wrapper });

    await user.click(screen.getByRole('button', { name: '新規ルーム作成' }));

    expect(screen.getByText('新しいチャンネルを作成')).toBeInTheDocument();
    expect(screen.getByLabelText('チャンネル名')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '作成する' })
    ).toBeInTheDocument();
  });

  it('チャンネル名を入力して作成ボタンを押すと createChatRoom が呼ばれる', async () => {
    const user = userEvent.setup();
    const { Wrapper } = createTestWrapper();

    const mockRoom: ChatRoom = {
      id: 42,
      name: 'test-room',
      createdAt: '2024-01-01T00:00:00Z',
      createdByUserId: 1,
      type: 'PUBLIC',
    };
    mockCreateChatRoom.mockResolvedValue(mockRoom);

    render(<CreateRoomDialog />, { wrapper: Wrapper });

    // ダイアログを開く
    await user.click(screen.getByRole('button', { name: '新規ルーム作成' }));

    // チャンネル名を入力
    await user.type(screen.getByLabelText('チャンネル名'), 'test-room');

    // 作成ボタンをクリック
    await user.click(screen.getByRole('button', { name: '作成する' }));

    await waitFor(() => {
      expect(mockCreateChatRoom).toHaveBeenCalledWith({ name: 'test-room' });
    });
  });

  it('チャンネル作成成功時に /chat/<roomId> へ遷移する', async () => {
    const user = userEvent.setup();
    const { Wrapper } = createTestWrapper();

    const mockRoom: ChatRoom = {
      id: 42,
      name: 'new-room',
      createdAt: '2024-01-01T00:00:00Z',
      createdByUserId: 1,
      type: 'PUBLIC',
    };
    mockCreateChatRoom.mockResolvedValue(mockRoom);

    render(<CreateRoomDialog />, { wrapper: Wrapper });

    await user.click(screen.getByRole('button', { name: '新規ルーム作成' }));
    await user.type(screen.getByLabelText('チャンネル名'), 'new-room');
    await user.click(screen.getByRole('button', { name: '作成する' }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/chat/42');
    });
  });

  it('チャンネル作成成功時にキャッシュが無効化される', async () => {
    const user = userEvent.setup();
    const { Wrapper, queryClient } = createTestWrapper();

    // 既存のキャッシュを設定
    const existingRooms: ChatRoom[] = [
      { id: 1, name: 'general', createdAt: '2024-01-01T00:00:00Z', createdByUserId: 1, type: 'PUBLIC' },
    ];
    queryClient.setQueryData(CHAT_ROOMS_QUERY_KEY, existingRooms);

    const mockRoom: ChatRoom = {
      id: 42,
      name: 'new-room',
      createdAt: '2024-01-01T00:00:00Z',
      createdByUserId: 1,
      type: 'PUBLIC',
    };
    mockCreateChatRoom.mockResolvedValue(mockRoom);

    render(<CreateRoomDialog />, { wrapper: Wrapper });

    await user.click(screen.getByRole('button', { name: '新規ルーム作成' }));
    await user.type(screen.getByLabelText('チャンネル名'), 'new-room');
    await user.click(screen.getByRole('button', { name: '作成する' }));

    // 作成成功後、キャッシュが無効化される（invalidateQueries を使用）
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/chat/42');
    });

    // キャッシュが無効化されていることを確認（stale になっている）
    const queryState = queryClient.getQueryState(CHAT_ROOMS_QUERY_KEY);
    expect(queryState?.isInvalidated).toBe(true);
  });

  it('空文字の場合は mutation が呼ばれない', async () => {
    const user = userEvent.setup();
    const { Wrapper } = createTestWrapper();

    render(<CreateRoomDialog />, { wrapper: Wrapper });

    await user.click(screen.getByRole('button', { name: '新規ルーム作成' }));

    // 入力せずに作成ボタンをクリック
    await user.click(screen.getByRole('button', { name: '作成する' }));

    expect(mockCreateChatRoom).not.toHaveBeenCalled();
  });

  it('空白のみの場合は mutation が呼ばれない', async () => {
    const user = userEvent.setup();
    const { Wrapper } = createTestWrapper();

    render(<CreateRoomDialog />, { wrapper: Wrapper });

    await user.click(screen.getByRole('button', { name: '新規ルーム作成' }));

    // 空白のみを入力
    await user.type(screen.getByLabelText('チャンネル名'), '   ');
    await user.click(screen.getByRole('button', { name: '作成する' }));

    expect(mockCreateChatRoom).not.toHaveBeenCalled();
  });

  it('入力値の前後の空白はトリムされる', async () => {
    const user = userEvent.setup();
    const { Wrapper } = createTestWrapper();

    const mockRoom: ChatRoom = {
      id: 42,
      name: 'trimmed-room',
      createdAt: '2024-01-01T00:00:00Z',
      createdByUserId: 1,
      type: 'PUBLIC',
    };
    mockCreateChatRoom.mockResolvedValue(mockRoom);

    render(<CreateRoomDialog />, { wrapper: Wrapper });

    await user.click(screen.getByRole('button', { name: '新規ルーム作成' }));
    await user.type(screen.getByLabelText('チャンネル名'), '  trimmed-room  ');
    await user.click(screen.getByRole('button', { name: '作成する' }));

    await waitFor(() => {
      expect(mockCreateChatRoom).toHaveBeenCalledWith({ name: 'trimmed-room' });
    });
  });

  it('作成中はボタンが無効化され、テキストが「作成中...」に変わる', async () => {
    const user = userEvent.setup();
    const { Wrapper } = createTestWrapper();

    // 解決を遅延させる
    let resolvePromise: (room: ChatRoom) => void;
    const pendingPromise = new Promise<ChatRoom>((resolve) => {
      resolvePromise = resolve;
    });
    mockCreateChatRoom.mockReturnValue(pendingPromise);

    render(<CreateRoomDialog />, { wrapper: Wrapper });

    await user.click(screen.getByRole('button', { name: '新規ルーム作成' }));
    await user.type(screen.getByLabelText('チャンネル名'), 'test-room');
    await user.click(screen.getByRole('button', { name: '作成する' }));

    // ローディング状態を確認
    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: '作成中...' });
      expect(submitButton).toBeDisabled();
    });

    // Promise を解決してクリーンアップ
    resolvePromise!({
      id: 42,
      name: 'test-room',
      createdAt: '2024-01-01T00:00:00Z',
      createdByUserId: 1,
      type: 'PUBLIC',
    });
  });

  it('作成成功後にフォームがリセットされる', async () => {
    const user = userEvent.setup();
    const { Wrapper } = createTestWrapper();

    const mockRoom: ChatRoom = {
      id: 42,
      name: 'test-room',
      createdAt: '2024-01-01T00:00:00Z',
      createdByUserId: 1,
      type: 'PUBLIC',
    };
    mockCreateChatRoom.mockResolvedValue(mockRoom);

    render(<CreateRoomDialog />, { wrapper: Wrapper });

    await user.click(screen.getByRole('button', { name: '新規ルーム作成' }));
    await user.type(screen.getByLabelText('チャンネル名'), 'test-room');
    await user.click(screen.getByRole('button', { name: '作成する' }));

    // 作成完了を待つ
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled();
    });

    // ダイアログを再度開く
    await user.click(screen.getByRole('button', { name: '新規ルーム作成' }));

    // 入力がリセットされていることを確認
    const input = screen.getByLabelText('チャンネル名') as HTMLInputElement;
    expect(input.value).toBe('');
  });
});
