/**
 * @fileoverview ChatRoomsService 単体テスト
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { ChatRoomsService } from './chat-rooms.service';
import { PrismaService } from '../prisma/prisma.service';
import { ChannelType, MemberRole } from '@prisma/client';

describe('ChatRoomsService', () => {
  let service: ChatRoomsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    chatRoom: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatRoomsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ChatRoomsService>(ChatRoomsService);
    prisma = module.get<PrismaService>(PrismaService);

    // 各テスト前にモックをリセット
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = { name: 'general' };
    const userId = 1;

    it('新規チャットルームを正常に作成できる', async () => {
      const createdRoom = {
        id: 1,
        name: createDto.name,
        description: null,
        type: ChannelType.PUBLIC,
        createdByUserId: userId,
        createdAt: new Date(),
      };

      mockPrismaService.chatRoom.findUnique.mockResolvedValue(null);
      mockPrismaService.chatRoom.create.mockResolvedValue(createdRoom);

      const result = await service.create(createDto, userId);

      expect(prisma.chatRoom.findUnique).toHaveBeenCalledWith({
        where: { name: createDto.name },
      });
      expect(prisma.chatRoom.create).toHaveBeenCalledWith({
        data: {
          name: createDto.name,
          description: undefined,
          type: ChannelType.PUBLIC,
          createdByUserId: userId,
          members: {
            create: {
              userId,
              role: MemberRole.OWNER,
            },
          },
        },
      });
      expect(result).toEqual(createdRoom);
    });

    it('説明付きでチャットルームを作成できる', async () => {
      const createDtoWithDesc = { name: 'general', description: 'General discussion' };
      const createdRoom = {
        id: 1,
        name: createDtoWithDesc.name,
        description: createDtoWithDesc.description,
        type: ChannelType.PUBLIC,
        createdByUserId: userId,
        createdAt: new Date(),
      };

      mockPrismaService.chatRoom.findUnique.mockResolvedValue(null);
      mockPrismaService.chatRoom.create.mockResolvedValue(createdRoom);

      const result = await service.create(createDtoWithDesc, userId);

      expect(prisma.chatRoom.create).toHaveBeenCalledWith({
        data: {
          name: createDtoWithDesc.name,
          description: createDtoWithDesc.description,
          type: ChannelType.PUBLIC,
          createdByUserId: userId,
          members: {
            create: {
              userId,
              role: MemberRole.OWNER,
            },
          },
        },
      });
      expect(result).toEqual(createdRoom);
    });

    it('プライベートチャンネルを作成できる', async () => {
      const createDtoPrivate = { name: 'private-channel', type: ChannelType.PRIVATE };
      const createdRoom = {
        id: 1,
        name: createDtoPrivate.name,
        description: null,
        type: ChannelType.PRIVATE,
        createdByUserId: userId,
        createdAt: new Date(),
      };

      mockPrismaService.chatRoom.findUnique.mockResolvedValue(null);
      mockPrismaService.chatRoom.create.mockResolvedValue(createdRoom);

      const result = await service.create(createDtoPrivate, userId);

      expect(prisma.chatRoom.create).toHaveBeenCalledWith({
        data: {
          name: createDtoPrivate.name,
          description: undefined,
          type: ChannelType.PRIVATE,
          createdByUserId: userId,
          members: {
            create: {
              userId,
              role: MemberRole.OWNER,
            },
          },
        },
      });
      expect(result).toEqual(createdRoom);
    });

    it('ルーム名が既に存在する場合は ConflictException をスローする', async () => {
      const existingRoom = {
        id: 1,
        name: createDto.name,
        createdByUserId: 2,
        createdAt: new Date(),
      };

      mockPrismaService.chatRoom.findUnique.mockResolvedValue(existingRoom);

      await expect(service.create(createDto, userId)).rejects.toThrow(
        new ConflictException('このルーム名は既に使用されています'),
      );

      expect(prisma.chatRoom.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('全てのチャットルームを取得できる', async () => {
      const rooms = [
        { id: 1, name: 'general', createdByUserId: 1, createdAt: new Date() },
        { id: 2, name: 'random', createdByUserId: 2, createdAt: new Date() },
      ];

      mockPrismaService.chatRoom.findMany.mockResolvedValue(rooms);

      const result = await service.findAll();

      expect(prisma.chatRoom.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'asc' },
      });
      expect(result).toEqual(rooms);
    });

    it('チャットルームが存在しない場合は空配列を返す', async () => {
      mockPrismaService.chatRoom.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('ID でチャットルームを取得できる', async () => {
      const room = {
        id: 1,
        name: 'general',
        createdByUserId: 1,
        createdAt: new Date(),
      };

      mockPrismaService.chatRoom.findUnique.mockResolvedValue(room);

      const result = await service.findById(1);

      expect(prisma.chatRoom.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(room);
    });

    it('存在しない ID の場合は null を返す', async () => {
      mockPrismaService.chatRoom.findUnique.mockResolvedValue(null);

      const result = await service.findById(999);

      expect(result).toBeNull();
    });
  });
});
