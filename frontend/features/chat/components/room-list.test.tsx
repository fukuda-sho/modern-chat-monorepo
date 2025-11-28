/**
 * ルーム一覧コンポーネントのテスト
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RoomList } from './room-list';

/** テスト用のルームデータ */
const TEST_ROOMS = [
  { id: 1, name: 'general', createdAt: '2024-01-01T00:00:00.000Z' },
  { id: 2, name: 'random', createdAt: '2024-01-01T00:00:00.000Z' },
  { id: 3, name: 'development', createdAt: '2024-01-01T00:00:00.000Z' },
];

// next/navigation のモック
const mockParams: { roomId?: string } = {};
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useParams: () => mockParams,
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

// next/link のモック - className を維持
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

// API のモック
const mockFetchChatRooms = vi.fn();
vi.mock('../api/chat-rooms-api', () => ({
  fetchChatRooms: () => mockFetchChatRooms(),
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

describe('RoomList', () => {
  beforeEach(() => {
    // params をリセット
    mockParams.roomId = undefined;
    // API モックをリセット
    mockFetchChatRooms.mockReset();
    mockFetchChatRooms.mockResolvedValue(TEST_ROOMS);
  });

  it('Channels ヘッダーが表示される', () => {
    render(<RoomList />, { wrapper: createTestWrapper() });

    expect(screen.getByText('Channels')).toBeInTheDocument();
  });

  it('読み込み中は「読み込み中...」が表示される', () => {
    // API を遅延させる
    mockFetchChatRooms.mockImplementation(
      () => new Promise(() => {}) // never resolves
    );

    render(<RoomList />, { wrapper: createTestWrapper() });

    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('API から取得したルームが全て表示される', async () => {
    render(<RoomList />, { wrapper: createTestWrapper() });

    for (const room of TEST_ROOMS) {
      expect(await screen.findByText(room.name)).toBeInTheDocument();
    }
  });

  it('API エラー時はエラーメッセージが表示される', async () => {
    mockFetchChatRooms.mockRejectedValue(new Error('API error'));

    render(<RoomList />, { wrapper: createTestWrapper() });

    expect(
      await screen.findByText('ルーム一覧の取得に失敗しました')
    ).toBeInTheDocument();
  });

  it('ルームが存在しない場合は空状態メッセージが表示される', async () => {
    mockFetchChatRooms.mockResolvedValue([]);

    render(<RoomList />, { wrapper: createTestWrapper() });

    expect(await screen.findByText('ルームがありません')).toBeInTheDocument();
  });

  it('各ルームが正しいリンクを持つ', async () => {
    render(<RoomList />, { wrapper: createTestWrapper() });

    await screen.findByText('general');

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(TEST_ROOMS.length);

    // 各リンクが正しい href を持つことを確認
    TEST_ROOMS.forEach((room, index) => {
      expect(links[index]).toHaveAttribute('href', `/chat/${room.id}`);
    });
  });

  it('現在のルームがアクティブ状態で表示される', async () => {
    mockParams.roomId = '2';

    const { container } = render(<RoomList />, { wrapper: createTestWrapper() });

    await screen.findByText('general');

    const links = container.querySelectorAll('a');

    // roomId=2 (random) がアクティブ - bg-accent クラスを含む
    expect(links[1].className).toContain('bg-accent');
    // 他のルームは hover:bg-accent クラスを含む（非アクティブ）
    expect(links[0].className).toContain('hover:bg-accent');
    expect(links[2].className).toContain('hover:bg-accent');
  });

  it('roomId がない場合、全てのルームが非アクティブ', async () => {
    mockParams.roomId = undefined;

    const { container } = render(<RoomList />, { wrapper: createTestWrapper() });

    await screen.findByText('general');

    const links = container.querySelectorAll('a');

    // 全てのルームが hover:bg-accent クラスを含む（非アクティブ）
    links.forEach((link) => {
      expect(link.className).toContain('hover:bg-accent');
    });
  });

  it('クリックしたときに正しい roomId のパスへ遷移するリンクを提供する', async () => {
    render(<RoomList />, { wrapper: createTestWrapper() });

    await screen.findByText('general');

    // general チャンネルのリンクをクリックすると /chat/1 へ
    const generalLink = screen.getByText('general').closest('a');
    expect(generalLink).toHaveAttribute('href', '/chat/1');

    // random チャンネルのリンクをクリックすると /chat/2 へ
    const randomLink = screen.getByText('random').closest('a');
    expect(randomLink).toHaveAttribute('href', '/chat/2');
  });
});
