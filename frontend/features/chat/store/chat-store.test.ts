/**
 * チャットストアのテスト
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useChatStore } from "./chat-store";
import type { Message } from "@/types";

describe("chat-store", () => {
  // 各テスト前にストアをリセット
  beforeEach(() => {
    useChatStore.getState().reset();
  });

  describe("addMessage", () => {
    it("新しいメッセージを指定したルームに追加する", () => {
      const message: Message = {
        id: 1,
        roomId: 1,
        userId: 1,
        content: "Hello",
        createdAt: "2025-01-01T00:00:00Z",
      };

      useChatStore.getState().addMessage(1, message);

      const messages = useChatStore.getState().messages.get(1);
      expect(messages).toHaveLength(1);
      expect(messages?.[0]).toEqual(message);
    });

    it("既存のメッセージ配列に追加する", () => {
      const message1: Message = {
        id: 1,
        roomId: 1,
        userId: 1,
        content: "First",
        createdAt: "2025-01-01T00:00:00Z",
      };
      const message2: Message = {
        id: 2,
        roomId: 1,
        userId: 2,
        content: "Second",
        createdAt: "2025-01-01T00:01:00Z",
      };

      useChatStore.getState().addMessage(1, message1);
      useChatStore.getState().addMessage(1, message2);

      const messages = useChatStore.getState().messages.get(1);
      expect(messages).toHaveLength(2);
      expect(messages?.[0].content).toBe("First");
      expect(messages?.[1].content).toBe("Second");
    });

    it("異なるルームのメッセージは別々に管理される", () => {
      const message1: Message = {
        id: 1,
        roomId: 1,
        userId: 1,
        content: "Room 1",
        createdAt: "2025-01-01T00:00:00Z",
      };
      const message2: Message = {
        id: 2,
        roomId: 2,
        userId: 1,
        content: "Room 2",
        createdAt: "2025-01-01T00:00:00Z",
      };

      useChatStore.getState().addMessage(1, message1);
      useChatStore.getState().addMessage(2, message2);

      expect(useChatStore.getState().messages.get(1)).toHaveLength(1);
      expect(useChatStore.getState().messages.get(2)).toHaveLength(1);
    });
  });

  describe("setMessages", () => {
    it("指定したルームのメッセージを一括設定する", () => {
      const messages: Message[] = [
        {
          id: 1,
          roomId: 1,
          userId: 1,
          content: "First",
          createdAt: "2025-01-01T00:00:00Z",
        },
        {
          id: 2,
          roomId: 1,
          userId: 2,
          content: "Second",
          createdAt: "2025-01-01T00:01:00Z",
        },
      ];

      useChatStore.getState().setMessages(1, messages);

      const storedMessages = useChatStore.getState().messages.get(1);
      expect(storedMessages).toHaveLength(2);
      expect(storedMessages).toEqual(messages);
    });

    it("既存のメッセージを上書きする", () => {
      const oldMessages: Message[] = [
        {
          id: 1,
          roomId: 1,
          userId: 1,
          content: "Old",
          createdAt: "2025-01-01T00:00:00Z",
        },
      ];
      const newMessages: Message[] = [
        {
          id: 2,
          roomId: 1,
          userId: 2,
          content: "New",
          createdAt: "2025-01-01T00:01:00Z",
        },
      ];

      useChatStore.getState().setMessages(1, oldMessages);
      useChatStore.getState().setMessages(1, newMessages);

      const storedMessages = useChatStore.getState().messages.get(1);
      expect(storedMessages).toHaveLength(1);
      expect(storedMessages?.[0].content).toBe("New");
    });
  });

  describe("clearMessages", () => {
    it("指定したルームのメッセージをクリアする", () => {
      const message: Message = {
        id: 1,
        roomId: 1,
        userId: 1,
        content: "Hello",
        createdAt: "2025-01-01T00:00:00Z",
      };

      useChatStore.getState().addMessage(1, message);
      useChatStore.getState().clearMessages(1);

      expect(useChatStore.getState().messages.get(1)).toBeUndefined();
    });

    it("他のルームのメッセージには影響しない", () => {
      const message1: Message = {
        id: 1,
        roomId: 1,
        userId: 1,
        content: "Room 1",
        createdAt: "2025-01-01T00:00:00Z",
      };
      const message2: Message = {
        id: 2,
        roomId: 2,
        userId: 1,
        content: "Room 2",
        createdAt: "2025-01-01T00:00:00Z",
      };

      useChatStore.getState().addMessage(1, message1);
      useChatStore.getState().addMessage(2, message2);
      useChatStore.getState().clearMessages(1);

      expect(useChatStore.getState().messages.get(1)).toBeUndefined();
      expect(useChatStore.getState().messages.get(2)).toHaveLength(1);
    });
  });

  describe("setConnectionStatus", () => {
    it("接続ステータスを更新する", () => {
      useChatStore.getState().setConnectionStatus("connecting");
      expect(useChatStore.getState().connectionStatus).toBe("connecting");

      useChatStore.getState().setConnectionStatus("connected");
      expect(useChatStore.getState().connectionStatus).toBe("connected");

      useChatStore.getState().setConnectionStatus("error");
      expect(useChatStore.getState().connectionStatus).toBe("error");
    });
  });

  describe("setCurrentRoom", () => {
    it("現在のルームIDを設定する", () => {
      useChatStore.getState().setCurrentRoom(1);
      expect(useChatStore.getState().currentRoomId).toBe(1);
    });

    it("nullを設定してルームを解除できる", () => {
      useChatStore.getState().setCurrentRoom(1);
      useChatStore.getState().setCurrentRoom(null);
      expect(useChatStore.getState().currentRoomId).toBeNull();
    });
  });

  describe("reset", () => {
    it("ストアを初期状態にリセットする", () => {
      // 状態を変更
      useChatStore.getState().addMessage(1, {
        id: 1,
        roomId: 1,
        userId: 1,
        content: "Hello",
        createdAt: "2025-01-01T00:00:00Z",
      });
      useChatStore.getState().setConnectionStatus("connected");
      useChatStore.getState().setCurrentRoom(1);

      // リセット
      useChatStore.getState().reset();

      // 初期状態を確認
      expect(useChatStore.getState().messages.size).toBe(0);
      expect(useChatStore.getState().connectionStatus).toBe("disconnected");
      expect(useChatStore.getState().currentRoomId).toBeNull();
    });
  });
});
