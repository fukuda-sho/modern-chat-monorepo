/**
 * ルーム一覧コンポーネントのテスト
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RoomList } from './room-list';
import { MOCK_ROOMS } from '../data/rooms';

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

// API のモック - エラーを返して MOCK_ROOMS にフォールバックさせる
vi.mock('../api/chat-rooms-api', () => ({
  fetchChatRooms: () => Promise.reject(new Error('API not available')),
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
  });

  it('Channels ヘッダーが表示される', () => {
    render(<RoomList />, { wrapper: createTestWrapper() });

    expect(screen.getByText('Channels')).toBeInTheDocument();
  });

  it('全てのモックルームが表示される', async () => {
    render(<RoomList />, { wrapper: createTestWrapper() });

    // API エラー後に MOCK_ROOMS にフォールバックするのを待つ
    for (const room of MOCK_ROOMS) {
      expect(await screen.findByText(room.name)).toBeInTheDocument();
    }
  });

  it('各ルームが正しいリンクを持つ', async () => {
    render(<RoomList />, { wrapper: createTestWrapper() });

    // フォールバック後のリンクを待つ
    await screen.findByText('general');

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(MOCK_ROOMS.length);

    // 各リンクが正しい href を持つことを確認
    MOCK_ROOMS.forEach((room, index) => {
      expect(links[index]).toHaveAttribute('href', `/chat/${room.id}`);
    });
  });

  it('現在のルームがアクティブ状態で表示される', async () => {
    mockParams.roomId = '2';

    const { container } = render(<RoomList />, { wrapper: createTestWrapper() });

    // フォールバック後を待つ
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

    // フォールバック後を待つ
    await screen.findByText('general');

    const links = container.querySelectorAll('a');

    // 全てのルームが hover:bg-accent クラスを含む（非アクティブ）
    links.forEach((link) => {
      expect(link.className).toContain('hover:bg-accent');
    });
  });

  it('クリックしたときに正しい roomId のパスへ遷移するリンクを提供する', async () => {
    render(<RoomList />, { wrapper: createTestWrapper() });

    // フォールバック後を待つ
    await screen.findByText('general');

    // general チャンネルのリンクをクリックすると /chat/1 へ
    const generalLink = screen.getByText('general').closest('a');
    expect(generalLink).toHaveAttribute('href', '/chat/1');

    // random チャンネルのリンクをクリックすると /chat/2 へ
    const randomLink = screen.getByText('random').closest('a');
    expect(randomLink).toHaveAttribute('href', '/chat/2');
  });
});
