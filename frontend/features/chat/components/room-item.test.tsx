/**
 * ルーム項目コンポーネントのテスト
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { RoomItem } from "./room-item";
import type { Room } from "@/types";

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

describe("RoomItem", () => {
  const mockRoom: Room = {
    id: 1,
    name: "general",
  };

  it("ルーム名が表示される", () => {
    render(<RoomItem room={mockRoom} isActive={false} />);

    expect(screen.getByText("general")).toBeInTheDocument();
  });

  it("正しいリンク先が設定される", () => {
    render(<RoomItem room={mockRoom} isActive={false} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/chat/1");
  });

  it("アクティブ状態ではスタイルクラスが設定される", () => {
    const { container } = render(<RoomItem room={mockRoom} isActive={true} />);

    const link = container.querySelector("a");
    // アクティブ時は bg-accent クラスを含む
    expect(link?.className).toContain("bg-accent");
  });

  it("非アクティブ状態ではホバースタイルクラスが設定される", () => {
    const { container } = render(<RoomItem room={mockRoom} isActive={false} />);

    const link = container.querySelector("a");
    // 非アクティブ時は hover:bg-accent クラスを含む
    expect(link?.className).toContain("hover:bg-accent");
  });

  it("長いルーム名が表示される", () => {
    const longNameRoom: Room = {
      id: 2,
      name: "very-long-channel-name-that-should-be-truncated",
    };

    render(<RoomItem room={longNameRoom} isActive={false} />);

    // 長いルーム名が表示されることを確認
    expect(screen.getByText(longNameRoom.name)).toBeInTheDocument();
  });
});
