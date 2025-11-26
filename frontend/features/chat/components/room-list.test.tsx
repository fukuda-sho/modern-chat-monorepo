/**
 * ルーム一覧コンポーネントのテスト
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RoomList } from "./room-list";

// next/navigation のモック
const mockParams: { roomId?: string } = {};
vi.mock("next/navigation", () => ({
  useParams: () => mockParams,
}));

// next/link のモック - className を維持
vi.mock("next/link", () => ({
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

describe("RoomList", () => {
  beforeEach(() => {
    // params をリセット
    mockParams.roomId = undefined;
  });

  it("Channels ヘッダーが表示される", () => {
    render(<RoomList />);

    expect(screen.getByText("Channels")).toBeInTheDocument();
  });

  it("全てのモックルームが表示される", () => {
    render(<RoomList />);

    // MOCK_ROOMS: general, random, development
    expect(screen.getByText("general")).toBeInTheDocument();
    expect(screen.getByText("random")).toBeInTheDocument();
    expect(screen.getByText("development")).toBeInTheDocument();
  });

  it("各ルームが正しいリンクを持つ", () => {
    render(<RoomList />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(3);
    expect(links[0]).toHaveAttribute("href", "/chat/1");
    expect(links[1]).toHaveAttribute("href", "/chat/2");
    expect(links[2]).toHaveAttribute("href", "/chat/3");
  });

  it("現在のルームがアクティブ状態で表示される", () => {
    mockParams.roomId = "2";

    const { container } = render(<RoomList />);

    const links = container.querySelectorAll("a");

    // roomId=2 (random) がアクティブ - bg-accent クラスを含む
    expect(links[1].className).toContain("bg-accent");
    // 他のルームは hover:bg-accent クラスを含む（非アクティブ）
    expect(links[0].className).toContain("hover:bg-accent");
    expect(links[2].className).toContain("hover:bg-accent");
  });

  it("roomId がない場合、全てのルームが非アクティブ", () => {
    mockParams.roomId = undefined;

    const { container } = render(<RoomList />);

    const links = container.querySelectorAll("a");

    // 全てのルームが hover:bg-accent クラスを含む（非アクティブ）
    links.forEach((link) => {
      expect(link.className).toContain("hover:bg-accent");
    });
  });
});
