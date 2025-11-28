/**
 * @fileoverview ChatRoomsController 単体テスト
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ChatRoomsController } from './chat-rooms.controller';
import { ChatRoomsService } from './chat-rooms.service';
import { ChannelMembershipService } from './channel-membership.service';

describe('ChatRoomsController', () => {
  let controller: ChatRoomsController;
  let chatRoomsService: ChatRoomsService;
  let membershipService: ChannelMembershipService;

  const mockChatRoomsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
  };

  const mockMembershipService = {
    getUserChannels: jest.fn(),
    getDiscoverableChannels: jest.fn(),
    joinPublicChannel: jest.fn(),
    leaveChannel: jest.fn(),
    inviteMembers: jest.fn(),
    kickMember: jest.fn(),
    toggleStar: jest.fn(),
    canAccessChannel: jest.fn(),
    getChannelMembers: jest.fn(),
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
        {
          provide: ChannelMembershipService,
          useValue: mockMembershipService,
        },
      ],
    }).compile();

    controller = module.get<ChatRoomsController>(ChatRoomsController);
    chatRoomsService = module.get<ChatRoomsService>(ChatRoomsService);
    membershipService = module.get<ChannelMembershipService>(ChannelMembershipService);

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

      expect(chatRoomsService.create).toHaveBeenCalledWith(createDto, mockUser.id);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('MembershipService.getUserChannels を呼び出してユーザーの参加チャンネル一覧を返す', async () => {
      const expectedResult = [
        { id: 1, name: 'general', createdByUserId: 1, createdAt: new Date() },
        { id: 2, name: 'random', createdByUserId: 2, createdAt: new Date() },
      ];

      mockMembershipService.getUserChannels.mockResolvedValue(expectedResult);

      const result = await controller.findAll(mockRequest as never);

      expect(membershipService.getUserChannels).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(expectedResult);
    });

    it('ユーザーが参加しているチャンネルがない場合は空配列を返す', async () => {
      mockMembershipService.getUserChannels.mockResolvedValue([]);

      const result = await controller.findAll(mockRequest as never);

      expect(result).toEqual([]);
    });
  });

  describe('browse', () => {
    it('参加可能なチャンネル一覧を返す', async () => {
      const expectedResult = [{ id: 3, name: 'public-channel', type: 'PUBLIC' }];

      mockMembershipService.getDiscoverableChannels.mockResolvedValue(expectedResult);

      const result = await controller.browse(mockRequest as never);

      expect(membershipService.getDiscoverableChannels).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('join', () => {
    it('パブリックチャンネルに参加できる', async () => {
      const membership = { userId: mockUser.id, chatRoomId: 1, role: 'MEMBER' };
      mockMembershipService.joinPublicChannel.mockResolvedValue(membership);

      const result = await controller.join(mockRequest as never, 1);

      expect(membershipService.joinPublicChannel).toHaveBeenCalledWith(mockUser.id, 1);
      expect(result).toEqual(membership);
    });
  });

  describe('leave', () => {
    it('チャンネルから退出できる', async () => {
      mockMembershipService.leaveChannel.mockResolvedValue(undefined);

      const result = await controller.leave(mockRequest as never, 1);

      expect(membershipService.leaveChannel).toHaveBeenCalledWith(mockUser.id, 1);
      expect(result).toEqual({ message: 'チャンネルから退出しました' });
    });
  });

  describe('toggleStar', () => {
    it('スター状態を切り替えられる', async () => {
      const newState = { isStarred: true };
      mockMembershipService.toggleStar.mockResolvedValue(newState);

      const result = await controller.toggleStar(mockRequest as never, 1);

      expect(membershipService.toggleStar).toHaveBeenCalledWith(mockUser.id, 1);
      expect(result).toEqual(newState);
    });
  });
});
