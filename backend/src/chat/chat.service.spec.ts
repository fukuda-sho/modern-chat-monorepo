/**
 * @fileoverview ChatService 単体テスト
 * @description メッセージ履歴取得機能のテスト
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';
import { ChannelMembershipService } from '../chat-rooms/channel-membership.service';

describe('ChatService', () => {
  let service: ChatService;
  let mockPrismaService: {
    chatRoom: {
      findUnique: jest.Mock;
    };
    message: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
    };
    user: {
      findUnique: jest.Mock;
    };
    reaction: {
      findUnique: jest.Mock;
      upsert: jest.Mock;
      delete: jest.Mock;
    };
  };
  let mockMembershipService: {
    canAccessChannel: jest.Mock;
  };

  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
  };

  const mockRoom = {
    id: 1,
    name: 'test-room',
    createdAt: new Date(),
    type: 'PUBLIC',
    description: null,
    createdByUserId: 1,
  };

  const mockMessages = [
    {
      id: 100,
      content: 'Message 100',
      chatRoomId: 1,
      userId: 1,
      createdAt: new Date('2025-11-27T10:00:00Z'),
      isEdited: false,
      editedAt: null,
      isDeleted: false,
      deletedAt: null,
      user: mockUser,
      reactions: [],
    },
    {
      id: 99,
      content: 'Message 99',
      chatRoomId: 1,
      userId: 1,
      createdAt: new Date('2025-11-27T09:00:00Z'),
      isEdited: false,
      editedAt: null,
      isDeleted: false,
      deletedAt: null,
      user: mockUser,
      reactions: [
        { emoji: '👍', userId: 1 },
        { emoji: '👍', userId: 2 },
        { emoji: '❤️', userId: 1 },
      ],
    },
    {
      id: 98,
      content: 'Message 98',
      chatRoomId: 1,
      userId: 1,
      createdAt: new Date('2025-11-27T08:00:00Z'),
      isEdited: false,
      editedAt: null,
      isDeleted: false,
      deletedAt: null,
      user: mockUser,
      reactions: [],
    },
  ];

  beforeEach(async () => {
    mockPrismaService = {
      chatRoom: {
        findUnique: jest.fn(),
      },
      message: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      reaction: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        delete: jest.fn(),
      },
    };

    mockMembershipService = {
      canAccessChannel: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ChannelMembershipService,
          useValue: mockMembershipService,
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  describe('getMessageHistory', () => {
    describe('正常系', () => {
      it('最新メッセージから指定件数を取得できること', async () => {
        mockPrismaService.chatRoom.findUnique.mockResolvedValue(mockRoom);
        mockMembershipService.canAccessChannel.mockResolvedValue(true);
        mockPrismaService.message.findMany.mockResolvedValue(mockMessages);

        const result = await service.getMessageHistory(1, 1, {
          limit: 50,
          direction: 'older',
        });

        expect(result.data).toHaveLength(3);
        expect(result.data[0].id).toBe(100);
        expect(result.data[2].id).toBe(98);
        expect(result.pagination.hasMore).toBe(false);
      });

      it('カーソル指定で古いメッセージを取得できること', async () => {
        const cursorMessage = {
          id: 100,
          createdAt: new Date('2025-11-27T10:00:00Z'),
        };

        mockPrismaService.chatRoom.findUnique.mockResolvedValue(mockRoom);
        mockMembershipService.canAccessChannel.mockResolvedValue(true);
        mockPrismaService.message.findUnique.mockResolvedValue(cursorMessage);
        mockPrismaService.message.findMany.mockResolvedValue(mockMessages.slice(1));

        const result = await service.getMessageHistory(1, 1, {
          limit: 50,
          cursor: 100,
          direction: 'older',
        });

        expect(mockPrismaService.message.findUnique).toHaveBeenCalledWith({
          where: { id: 100 },
          select: { createdAt: true, id: true },
        });
        expect(result.data).toHaveLength(2);
      });

      it('カーソル指定で新しいメッセージを取得できること', async () => {
        const cursorMessage = {
          id: 98,
          createdAt: new Date('2025-11-27T08:00:00Z'),
        };

        mockPrismaService.chatRoom.findUnique.mockResolvedValue(mockRoom);
        mockMembershipService.canAccessChannel.mockResolvedValue(true);
        mockPrismaService.message.findUnique.mockResolvedValue(cursorMessage);
        // direction='newer' の場合、新しいメッセージ順（asc）で返ってくる
        const newerMessages = [...mockMessages.slice(0, 2)].reverse();
        mockPrismaService.message.findMany.mockResolvedValue(newerMessages);

        const result = await service.getMessageHistory(1, 1, {
          limit: 50,
          cursor: 98,
          direction: 'newer',
        });

        // reverse() されて時系列順になる
        expect(result.data[0].id).toBe(100);
        expect(result.data[1].id).toBe(99);
      });

      it('hasMore が正しく判定されること', async () => {
        // limit + 1 件返ってきた場合、hasMore = true
        const messagesWithMore = [
          ...mockMessages,
          {
            id: 97,
            content: 'Message 97',
            chatRoomId: 1,
            userId: 1,
            createdAt: new Date('2025-11-27T07:00:00Z'),
            user: mockUser,
          },
        ];

        mockPrismaService.chatRoom.findUnique.mockResolvedValue(mockRoom);
        mockMembershipService.canAccessChannel.mockResolvedValue(true);
        mockPrismaService.message.findMany.mockResolvedValue(messagesWithMore);

        const result = await service.getMessageHistory(1, 1, {
          limit: 3,
          direction: 'older',
        });

        expect(result.pagination.hasMore).toBe(true);
        expect(result.data).toHaveLength(3);
        expect(result.pagination.nextCursor).toBe(98);
      });

      it('メッセージが時系列順にソートされていること', async () => {
        mockPrismaService.chatRoom.findUnique.mockResolvedValue(mockRoom);
        mockMembershipService.canAccessChannel.mockResolvedValue(true);
        mockPrismaService.message.findMany.mockResolvedValue(mockMessages);

        const result = await service.getMessageHistory(1, 1, {
          limit: 50,
          direction: 'older',
        });

        // 新しい順（descending）で返される
        for (let i = 0; i < result.data.length - 1; i++) {
          expect(new Date(result.data[i].createdAt).getTime()).toBeGreaterThanOrEqual(
            new Date(result.data[i + 1].createdAt).getTime(),
          );
        }
      });
    });

    describe('異常系', () => {
      it('存在しないルームで404エラーを返すこと', async () => {
        mockPrismaService.chatRoom.findUnique.mockResolvedValue(null);

        await expect(
          service.getMessageHistory(999, 1, { limit: 50, direction: 'older' }),
        ).rejects.toThrow(NotFoundException);
      });

      it('アクセス権のないルームで403エラーを返すこと', async () => {
        mockPrismaService.chatRoom.findUnique.mockResolvedValue(mockRoom);
        mockMembershipService.canAccessChannel.mockResolvedValue(false);

        await expect(
          service.getMessageHistory(1, 999, { limit: 50, direction: 'older' }),
        ).rejects.toThrow(ForbiddenException);
      });

      it('無効なカーソルでも正常に動作すること', async () => {
        mockPrismaService.chatRoom.findUnique.mockResolvedValue(mockRoom);
        mockMembershipService.canAccessChannel.mockResolvedValue(true);
        mockPrismaService.message.findUnique.mockResolvedValue(null);
        mockPrismaService.message.findMany.mockResolvedValue(mockMessages);

        const result = await service.getMessageHistory(1, 1, {
          limit: 50,
          cursor: 9999, // 存在しないカーソル
          direction: 'older',
        });

        // カーソルが null として扱われ、最新から取得される
        expect(result.data).toHaveLength(3);
      });
    });

    describe('境界値', () => {
      it('メッセージが0件の場合、空配列を返すこと', async () => {
        mockPrismaService.chatRoom.findUnique.mockResolvedValue(mockRoom);
        mockMembershipService.canAccessChannel.mockResolvedValue(true);
        mockPrismaService.message.findMany.mockResolvedValue([]);

        const result = await service.getMessageHistory(1, 1, {
          limit: 50,
          direction: 'older',
        });

        expect(result.data).toHaveLength(0);
        expect(result.pagination.hasMore).toBe(false);
        expect(result.pagination.nextCursor).toBeNull();
        expect(result.pagination.prevCursor).toBeNull();
      });

      it('limit=1 で正しく動作すること', async () => {
        const twoMessages = [mockMessages[0], mockMessages[1]];
        mockPrismaService.chatRoom.findUnique.mockResolvedValue(mockRoom);
        mockMembershipService.canAccessChannel.mockResolvedValue(true);
        mockPrismaService.message.findMany.mockResolvedValue(twoMessages);

        const result = await service.getMessageHistory(1, 1, {
          limit: 1,
          direction: 'older',
        });

        expect(result.data).toHaveLength(1);
        expect(result.pagination.hasMore).toBe(true);
      });

      it('limit=100 で正しく動作すること', async () => {
        mockPrismaService.chatRoom.findUnique.mockResolvedValue(mockRoom);
        mockMembershipService.canAccessChannel.mockResolvedValue(true);
        mockPrismaService.message.findMany.mockResolvedValue(mockMessages);

        const result = await service.getMessageHistory(1, 1, {
          limit: 100,
          direction: 'older',
        });

        expect(mockPrismaService.message.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            take: 101, // limit + 1
          }),
        );
      });
    });

    describe('リアクション集計', () => {
      it('リアクションが絵文字ごとに集計されること', async () => {
        mockPrismaService.chatRoom.findUnique.mockResolvedValue(mockRoom);
        mockMembershipService.canAccessChannel.mockResolvedValue(true);
        mockPrismaService.message.findMany.mockResolvedValue([mockMessages[1]]);

        const result = await service.getMessageHistory(1, 1, {
          limit: 50,
          direction: 'older',
        });

        expect(result.data[0].reactions).toHaveLength(2);
        const thumbsUp = result.data[0].reactions.find((r) => r.emoji === '👍');
        expect(thumbsUp?.count).toBe(2);
        expect(thumbsUp?.userIds).toEqual([1, 2]);
        const heart = result.data[0].reactions.find((r) => r.emoji === '❤️');
        expect(heart?.count).toBe(1);
        expect(heart?.userIds).toEqual([1]);
      });
    });
  });

  describe('editMessage', () => {
    const mockMessage = {
      id: 100,
      content: 'Original message',
      chatRoomId: 1,
      userId: 1,
      isEdited: false,
      editedAt: null,
      isDeleted: false,
    };

    it('自分のメッセージを編集できること', async () => {
      const editedAt = new Date();
      mockPrismaService.message.findUnique.mockResolvedValue(mockMessage);
      mockPrismaService.message.update.mockResolvedValue({
        ...mockMessage,
        content: 'Edited message',
        isEdited: true,
        editedAt,
      });

      const result = await service.editMessage(100, 1, 'Edited message');

      expect(result.id).toBe(100);
      expect(result.content).toBe('Edited message');
      expect(result.isEdited).toBe(true);
      expect(result.editedAt).toBe(editedAt.toISOString());
    });

    it('存在しないメッセージで404エラーを返すこと', async () => {
      mockPrismaService.message.findUnique.mockResolvedValue(null);

      await expect(service.editMessage(999, 1, 'New content')).rejects.toThrow(NotFoundException);
    });

    it('他人のメッセージを編集しようとすると403エラーを返すこと', async () => {
      mockPrismaService.message.findUnique.mockResolvedValue(mockMessage);

      await expect(service.editMessage(100, 999, 'New content')).rejects.toThrow(ForbiddenException);
    });

    it('削除済みメッセージを編集しようとすると403エラーを返すこと', async () => {
      mockPrismaService.message.findUnique.mockResolvedValue({
        ...mockMessage,
        isDeleted: true,
      });

      await expect(service.editMessage(100, 1, 'New content')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteMessage', () => {
    const mockMessage = {
      id: 100,
      content: 'Message to delete',
      chatRoomId: 1,
      userId: 1,
      isDeleted: false,
    };

    it('自分のメッセージを削除できること', async () => {
      mockPrismaService.message.findUnique.mockResolvedValue(mockMessage);
      mockPrismaService.message.update.mockResolvedValue({
        ...mockMessage,
        isDeleted: true,
        deletedAt: new Date(),
      });

      const result = await service.deleteMessage(100, 1);

      expect(result.id).toBe(100);
      expect(result.roomId).toBe(1);
      expect(mockPrismaService.message.update).toHaveBeenCalledWith({
        where: { id: 100 },
        data: {
          isDeleted: true,
          deletedAt: expect.any(Date),
        },
      });
    });

    it('存在しないメッセージで404エラーを返すこと', async () => {
      mockPrismaService.message.findUnique.mockResolvedValue(null);

      await expect(service.deleteMessage(999, 1)).rejects.toThrow(NotFoundException);
    });

    it('他人のメッセージを削除しようとすると403エラーを返すこと', async () => {
      mockPrismaService.message.findUnique.mockResolvedValue(mockMessage);

      await expect(service.deleteMessage(100, 999)).rejects.toThrow(ForbiddenException);
    });

    it('既に削除済みのメッセージで403エラーを返すこと', async () => {
      mockPrismaService.message.findUnique.mockResolvedValue({
        ...mockMessage,
        isDeleted: true,
      });

      await expect(service.deleteMessage(100, 1)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('addReaction', () => {
    const mockMessage = {
      id: 100,
      chatRoomId: 1,
      chatRoom: mockRoom,
    };

    it('リアクションを追加できること', async () => {
      mockPrismaService.message.findUnique.mockResolvedValue(mockMessage);
      mockMembershipService.canAccessChannel.mockResolvedValue(true);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.reaction.upsert.mockResolvedValue({
        id: 1,
        emoji: '👍',
        userId: 1,
        messageId: 100,
      });

      const result = await service.addReaction(100, 1, '👍');

      expect(result.messageId).toBe(100);
      expect(result.roomId).toBe(1);
      expect(result.emoji).toBe('👍');
      expect(result.userId).toBe(1);
      expect(result.username).toBe('testuser');
    });

    it('存在しないメッセージで404エラーを返すこと', async () => {
      mockPrismaService.message.findUnique.mockResolvedValue(null);

      await expect(service.addReaction(999, 1, '👍')).rejects.toThrow(NotFoundException);
    });

    it('アクセス権のないルームで403エラーを返すこと', async () => {
      mockPrismaService.message.findUnique.mockResolvedValue(mockMessage);
      mockMembershipService.canAccessChannel.mockResolvedValue(false);

      await expect(service.addReaction(100, 999, '👍')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeReaction', () => {
    const mockMessage = {
      id: 100,
      chatRoomId: 1,
    };

    const mockReaction = {
      id: 1,
      emoji: '👍',
      userId: 1,
      messageId: 100,
    };

    it('リアクションを削除できること', async () => {
      mockPrismaService.message.findUnique.mockResolvedValue(mockMessage);
      mockPrismaService.reaction.findUnique.mockResolvedValue(mockReaction);
      mockPrismaService.reaction.delete.mockResolvedValue(mockReaction);

      const result = await service.removeReaction(100, 1, '👍');

      expect(result.messageId).toBe(100);
      expect(result.roomId).toBe(1);
      expect(result.emoji).toBe('👍');
      expect(result.userId).toBe(1);
    });

    it('存在しないメッセージで404エラーを返すこと', async () => {
      mockPrismaService.message.findUnique.mockResolvedValue(null);

      await expect(service.removeReaction(999, 1, '👍')).rejects.toThrow(NotFoundException);
    });

    it('存在しないリアクションで404エラーを返すこと', async () => {
      mockPrismaService.message.findUnique.mockResolvedValue(mockMessage);
      mockPrismaService.reaction.findUnique.mockResolvedValue(null);

      await expect(service.removeReaction(100, 1, '👍')).rejects.toThrow(NotFoundException);
    });
  });
});
