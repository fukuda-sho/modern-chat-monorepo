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
      user: mockUser,
    },
    {
      id: 99,
      content: 'Message 99',
      chatRoomId: 1,
      userId: 1,
      createdAt: new Date('2025-11-27T09:00:00Z'),
      user: mockUser,
    },
    {
      id: 98,
      content: 'Message 98',
      chatRoomId: 1,
      userId: 1,
      createdAt: new Date('2025-11-27T08:00:00Z'),
      user: mockUser,
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
  });
});
