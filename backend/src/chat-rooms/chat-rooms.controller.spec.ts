/**
 * @fileoverview ChatRoomsController 単体テスト
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ChatRoomsController } from './chat-rooms.controller';
import { ChatRoomsService } from './chat-rooms.service';

describe('ChatRoomsController', () => {
  let controller: ChatRoomsController;
  let service: ChatRoomsService;

  const mockChatRoomsService = {
    create: jest.fn(),
    findAll: jest.fn(),
  };

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
  };

  const mockRequest = {
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatRoomsController],
      providers: [
        {
          provide: ChatRoomsService,
          useValue: mockChatRoomsService,
        },
      ],
    }).compile();

    controller = module.get<ChatRoomsController>(ChatRoomsController);
    service = module.get<ChatRoomsService>(ChatRoomsService);

    // 各テスト前にモックをリセット
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = { name: 'general' };

    it('ChatRoomsService.create を呼び出してチャットルーム情報を返す', async () => {
      const expectedResult = {
        id: 1,
        name: createDto.name,
        createdByUserId: mockUser.id,
        createdAt: new Date(),
      };

      mockChatRoomsService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(mockRequest as never, createDto);

      expect(service.create).toHaveBeenCalledWith(createDto, mockUser.id);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('ChatRoomsService.findAll を呼び出してチャットルーム一覧を返す', async () => {
      const expectedResult = [
        { id: 1, name: 'general', createdByUserId: 1, createdAt: new Date() },
        { id: 2, name: 'random', createdByUserId: 2, createdAt: new Date() },
      ];

      mockChatRoomsService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });

    it('チャットルームが存在しない場合は空配列を返す', async () => {
      mockChatRoomsService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
    });
  });
});
