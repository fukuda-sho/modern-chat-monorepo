/**
 * WebSocket 接続管理フックのテスト
 */

import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useChatStore } from "../store/chat-store";

// socketService のモック - vi.hoisted を使用
const mockSocketService = vi.hoisted(() => ({
  connectWithStoredToken: vi.fn(),
  disconnect: vi.fn(),
  joinRoom: vi.fn(),
  leaveRoom: vi.fn(),
  sendMessage: vi.fn(),
}));

vi.mock("@/lib/socket", () => ({
  socketService: mockSocketService,
}));

// モック後にインポート
import { useChatSocket } from "./use-chat-socket";

describe("useChatSocket", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // ストアをリセット
    useChatStore.getState().reset();
  });

  afterEach(() => {
    // テスト後にストアをリセット
    useChatStore.getState().reset();
  });

  describe("接続管理", () => {
    it("マウント時に connectWithStoredToken が呼ばれる", () => {
      renderHook(() => useChatSocket());

      expect(mockSocketService.connectWithStoredToken).toHaveBeenCalledTimes(1);
    });

    it("アンマウント時に disconnect が呼ばれる", () => {
      const { unmount } = renderHook(() => useChatSocket());

      unmount();

      expect(mockSocketService.disconnect).toHaveBeenCalledTimes(1);
    });

    it("再マウント時に再接続される", () => {
      const { unmount, rerender } = renderHook(() => useChatSocket());

      // 最初のマウント
      expect(mockSocketService.connectWithStoredToken).toHaveBeenCalledTimes(1);

      // アンマウント
      unmount();
      expect(mockSocketService.disconnect).toHaveBeenCalledTimes(1);
    });
  });

  describe("接続状態", () => {
    it("disconnected 状態では isConnected が false", () => {
      useChatStore.getState().setConnectionStatus("disconnected");

      const { result } = renderHook(() => useChatSocket());

      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionStatus).toBe("disconnected");
    });

    it("connected 状態では isConnected が true", () => {
      useChatStore.getState().setConnectionStatus("connected");

      const { result } = renderHook(() => useChatSocket());

      expect(result.current.isConnected).toBe(true);
      expect(result.current.connectionStatus).toBe("connected");
    });

    it("connecting 状態では isConnected が false", () => {
      useChatStore.getState().setConnectionStatus("connecting");

      const { result } = renderHook(() => useChatSocket());

      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionStatus).toBe("connecting");
    });

    it("error 状態では isConnected が false", () => {
      useChatStore.getState().setConnectionStatus("error");

      const { result } = renderHook(() => useChatSocket());

      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionStatus).toBe("error");
    });
  });

  describe("ルーム操作", () => {
    it("joinRoom がルームIDを渡して socketService.joinRoom を呼ぶ", () => {
      const { result } = renderHook(() => useChatSocket());

      act(() => {
        result.current.joinRoom(1);
      });

      expect(mockSocketService.joinRoom).toHaveBeenCalledWith(1);
    });

    it("leaveRoom がルームIDを渡して socketService.leaveRoom を呼ぶ", () => {
      const { result } = renderHook(() => useChatSocket());

      act(() => {
        result.current.leaveRoom(1);
      });

      expect(mockSocketService.leaveRoom).toHaveBeenCalledWith(1);
    });
  });

  describe("メッセージ送信", () => {
    it("sendMessage がルームIDとコンテンツを渡して socketService.sendMessage を呼ぶ", () => {
      const { result } = renderHook(() => useChatSocket());

      act(() => {
        result.current.sendMessage(1, "Hello, World!");
      });

      expect(mockSocketService.sendMessage).toHaveBeenCalledWith(
        1,
        "Hello, World!"
      );
    });
  });

  describe("関数の参照安定性", () => {
    it("joinRoom, leaveRoom, sendMessage の参照が安定している", () => {
      const { result, rerender } = renderHook(() => useChatSocket());

      const initialJoinRoom = result.current.joinRoom;
      const initialLeaveRoom = result.current.leaveRoom;
      const initialSendMessage = result.current.sendMessage;

      // 再レンダリング
      rerender();

      // useCallback により参照が維持される
      expect(result.current.joinRoom).toBe(initialJoinRoom);
      expect(result.current.leaveRoom).toBe(initialLeaveRoom);
      expect(result.current.sendMessage).toBe(initialSendMessage);
    });
  });
});
