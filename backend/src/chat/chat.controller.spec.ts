/**
 * @fileoverview ChatController 単体テスト
 * @description メッセージ履歴取得エンドポイントのテスト
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { MessageHistoryResponseDto } from './dto/message.dto';

describe('ChatController', () => {
type ExtendedChatService = jest.Mocked<
  ChatService & {
    getThreadMessages: jest.Mock;
    createThreadReply: jest.Mock;
  }
>;

let controller: ChatController;
let chatService: ExtendedChatService;

  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
  };

  const mockMessageHistoryResponse: MessageHistoryResponseDto = {
    data: [
      {
        id: 100,
        content: 'Hello, world!',
        roomId: 1,
        parentMessageId: null,
        userId: 1,
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
        },
        createdAt: '2025-11-27T10:00:00.000Z',
        isEdited: false,
        editedAt: null,
        isDeleted: false,
        threadReplyCount: 0,
        threadLastRepliedAt: null,
        threadLastRepliedBy: null,
        threadLastRepliedByUser: null,
        reactions: [],
      },
    ],
    pagination: {
      hasMore: false,
      nextCursor: null,
      prevCursor: 100,
    },
  };

  beforeEach(async () => {
    const mockChatService = {
      getMessageHistory: jest.fn(),
      getThreadMessages: jest.fn(),
      createThreadReply: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        {
          provide: ChatService,
          useValue: mockChatService,
        },
      ],
    }).compile();

    controller = module.get<ChatController>(ChatController);
    chatService = module.get(ChatService);
  });

  describe('getMessages', () => {
    it('認証済みユーザーがメッセージ履歴を取得できること', async () => {
      chatService.getMessageHistory.mockResolvedValue(mockMessageHistoryResponse);

      const result = await controller.getMessages(1, { limit: 50, direction: 'older' }, mockUser);

      expect(chatService.getMessageHistory).toHaveBeenCalledWith(1, mockUser.id, {
        limit: 50,
        direction: 'older',
      });
      expect(result).toEqual(mockMessageHistoryResponse);
    });

    it('カーソル付きリクエストが正しく処理されること', async () => {
      chatService.getMessageHistory.mockResolvedValue(mockMessageHistoryResponse);

      await controller.getMessages(1, { limit: 30, cursor: 99, direction: 'older' }, mockUser);

      expect(chatService.getMessageHistory).toHaveBeenCalledWith(1, mockUser.id, {
        limit: 30,
        cursor: 99,
        direction: 'older',
      });
    });

    it('direction=newer のリクエストが正しく処理されること', async () => {
      chatService.getMessageHistory.mockResolvedValue(mockMessageHistoryResponse);

      await controller.getMessages(1, { limit: 50, cursor: 50, direction: 'newer' }, mockUser);

      expect(chatService.getMessageHistory).toHaveBeenCalledWith(1, mockUser.id, {
        limit: 50,
        cursor: 50,
        direction: 'newer',
      });
    });

    it('デフォルト値が適用されること', async () => {
      chatService.getMessageHistory.mockResolvedValue(mockMessageHistoryResponse);

      await controller.getMessages(1, {}, mockUser);

      expect(chatService.getMessageHistory).toHaveBeenCalledWith(1, mockUser.id, {});
    });
  });

  describe('getThreadMessages', () => {
    it('スレッドメッセージを取得できること', async () => {
      chatService.getThreadMessages.mockResolvedValue({
        parent: mockMessageHistoryResponse.data[0],
        replies: [],
        pagination: { hasMore: false, nextCursor: null, prevCursor: null },
      });

      await controller.getThreadMessages(10, { limit: 30 }, mockUser);

      expect(chatService.getThreadMessages).toHaveBeenCalledWith(10, mockUser.id, { limit: 30 });
    });
  });

  describe('createThreadReply', () => {
    it('スレッド返信作成をサービスへ委譲すること', async () => {
      chatService.createThreadReply.mockResolvedValue({
        replyDto: mockMessageHistoryResponse.data[0],
      });

      const result = await controller.createThreadReply(10, { content: 'reply' }, mockUser);

      expect(chatService.createThreadReply).toHaveBeenCalledWith(10, mockUser.id, 'reply');
      expect(result).toEqual(mockMessageHistoryResponse.data[0]);
    });
  });
});
