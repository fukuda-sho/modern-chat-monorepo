/**
 * ルーム一覧コンポーネントのテスト
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoomList } from './room-list';
import { MOCK_ROOMS } from '../data/rooms';

// next/navigation のモック
const mockParams: { roomId?: string } = {};
vi.mock('next/navigation', () => ({
  useParams: () => mockParams,
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

describe('RoomList', () => {
  beforeEach(() => {
    // params をリセット
    mockParams.roomId = undefined;
  });

  it('Channels ヘッダーが表示される', () => {
    render(<RoomList />);

    expect(screen.getByText('Channels')).toBeInTheDocument();
  });

  it('全てのモックルームが表示される', () => {
    render(<RoomList />);

    // MOCK_ROOMS から取得したルーム名がすべて表示されることを確認
    MOCK_ROOMS.forEach((room) => {
      expect(screen.getByText(room.name)).toBeInTheDocument();
    });
  });

  it('各ルームが正しいリンクを持つ', () => {
    render(<RoomList />);

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(MOCK_ROOMS.length);

    // 各リンクが正しい href を持つことを確認
    MOCK_ROOMS.forEach((room, index) => {
      expect(links[index]).toHaveAttribute('href', `/chat/${room.id}`);
    });
  });

  it('現在のルームがアクティブ状態で表示される', () => {
    mockParams.roomId = '2';

    const { container } = render(<RoomList />);

    const links = container.querySelectorAll('a');

    // roomId=2 (random) がアクティブ - bg-accent クラスを含む
    expect(links[1].className).toContain('bg-accent');
    // 他のルームは hover:bg-accent クラスを含む（非アクティブ）
    expect(links[0].className).toContain('hover:bg-accent');
    expect(links[2].className).toContain('hover:bg-accent');
  });

  it('roomId がない場合、全てのルームが非アクティブ', () => {
    mockParams.roomId = undefined;

    const { container } = render(<RoomList />);

    const links = container.querySelectorAll('a');

    // 全てのルームが hover:bg-accent クラスを含む（非アクティブ）
    links.forEach((link) => {
      expect(link.className).toContain('hover:bg-accent');
    });
  });

  it('クリックしたときに正しい roomId のパスへ遷移するリンクを提供する', () => {
    render(<RoomList />);

    // general チャンネルのリンクをクリックすると /chat/1 へ
    const generalLink = screen.getByText('general').closest('a');
    expect(generalLink).toHaveAttribute('href', '/chat/1');

    // random チャンネルのリンクをクリックすると /chat/2 へ
    const randomLink = screen.getByText('random').closest('a');
    expect(randomLink).toHaveAttribute('href', '/chat/2');
  });
});
