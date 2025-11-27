/**
 * @fileoverview Channel Membership Service
 * @description チャンネルメンバーシップの管理ロジックを提供するサービス
 */

import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChannelMember, ChatRoom, MemberRole, ChannelType } from '@prisma/client';

/**
 * チャンネルメンバー情報（ユーザー情報含む）
 */
export type ChannelMemberWithUser = ChannelMember & {
  user: {
    id: number;
    username: string;
    email: string;
  };
};

/**
 * チャンネル情報（メンバーシップ情報含む）
 */
export type ChannelWithMembership = ChatRoom & {
  membership?: {
    role: MemberRole;
    isStarred: boolean;
  } | null;
  memberCount: number;
};

/**
 * Channel Membership Service
 * @description チャンネルの参加・退出・招待・キック等のメンバーシップ管理を担当
 */
@Injectable()
export class ChannelMembershipService {
  /**
   * コンストラクタ
   * @param {PrismaService} prisma - Prisma サービスインスタンス
   */
  constructor(private prisma: PrismaService) {}

  /**
   * パブリックチャンネルに参加する
   * @param {number} userId - ユーザー ID
   * @param {number} roomId - チャンネル ID
   * @returns {Promise<ChannelMember>} 作成されたメンバーシップ
   * @throws {NotFoundException} チャンネルが存在しない場合
   * @throws {ForbiddenException} プライベートチャンネルに直接参加しようとした場合
   * @throws {BadRequestException} 既にメンバーの場合
   */
  async joinPublicChannel(userId: number, roomId: number): Promise<ChannelMember> {
    // チャンネルの存在確認とタイプチェック
    const channel = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
    });

    if (!channel) {
      throw new NotFoundException('チャンネルが見つかりません');
    }

    if (channel.type === ChannelType.PRIVATE) {
      throw new ForbiddenException('プライベートチャンネルには招待が必要です');
    }

    if (channel.type === ChannelType.DM) {
      throw new ForbiddenException('DMチャンネルには直接参加できません');
    }

    // 既存メンバーシップ確認
    const existingMembership = await this.prisma.channelMember.findUnique({
      where: {
        userId_chatRoomId: { userId, chatRoomId: roomId },
      },
    });

    if (existingMembership) {
      throw new BadRequestException('既にこのチャンネルのメンバーです');
    }

    // メンバーシップ作成
    return this.prisma.channelMember.create({
      data: {
        userId,
        chatRoomId: roomId,
        role: MemberRole.MEMBER,
      },
    });
  }

  /**
   * チャンネルから退出する
   * @param {number} userId - ユーザー ID
   * @param {number} roomId - チャンネル ID
   * @throws {NotFoundException} メンバーシップが存在しない場合
   * @throws {ForbiddenException} オーナーが退出しようとした場合
   */
  async leaveChannel(userId: number, roomId: number): Promise<void> {
    const membership = await this.prisma.channelMember.findUnique({
      where: {
        userId_chatRoomId: { userId, chatRoomId: roomId },
      },
    });

    if (!membership) {
      throw new NotFoundException('このチャンネルのメンバーではありません');
    }

    if (membership.role === MemberRole.OWNER) {
      throw new ForbiddenException(
        'オーナーはチャンネルから退出できません。オーナー権限を移譲してください。',
      );
    }

    await this.prisma.channelMember.delete({
      where: {
        userId_chatRoomId: { userId, chatRoomId: roomId },
      },
    });
  }

  /**
   * メンバーをチャンネルに招待する
   * @param {number} inviterId - 招待者のユーザー ID
   * @param {number} roomId - チャンネル ID
   * @param {number[]} userIds - 招待するユーザー ID の配列
   * @returns {Promise<ChannelMember[]>} 作成されたメンバーシップの配列
   * @throws {ForbiddenException} 招待権限がない場合
   */
  async inviteMembers(
    inviterId: number,
    roomId: number,
    userIds: number[],
  ): Promise<ChannelMember[]> {
    // 招待者の権限確認
    const inviterMembership = await this.prisma.channelMember.findUnique({
      where: {
        userId_chatRoomId: { userId: inviterId, chatRoomId: roomId },
      },
    });

    if (!inviterMembership) {
      throw new ForbiddenException('このチャンネルのメンバーではありません');
    }

    if (inviterMembership.role === MemberRole.MEMBER) {
      throw new ForbiddenException('メンバーの招待権限がありません');
    }

    // 既存メンバーを除外
    const existingMembers = await this.prisma.channelMember.findMany({
      where: {
        chatRoomId: roomId,
        userId: { in: userIds },
      },
      select: { userId: true },
    });

    const existingUserIds = new Set(existingMembers.map((m) => m.userId));
    const newUserIds = userIds.filter((id) => !existingUserIds.has(id));

    if (newUserIds.length === 0) {
      return [];
    }

    // メンバーシップ一括作成
    await this.prisma.channelMember.createMany({
      data: newUserIds.map((userId) => ({
        userId,
        chatRoomId: roomId,
        role: MemberRole.MEMBER,
      })),
    });

    // 作成されたメンバーシップを取得して返す
    return this.prisma.channelMember.findMany({
      where: {
        chatRoomId: roomId,
        userId: { in: newUserIds },
      },
    });
  }

  /**
   * メンバーをチャンネルからキックする
   * @param {number} requesterId - リクエスト者のユーザー ID
   * @param {number} roomId - チャンネル ID
   * @param {number} targetUserId - キック対象のユーザー ID
   * @throws {ForbiddenException} キック権限がない場合
   * @throws {NotFoundException} 対象がメンバーでない場合
   */
  async kickMember(requesterId: number, roomId: number, targetUserId: number): Promise<void> {
    // リクエスト者の権限確認
    const requesterMembership = await this.prisma.channelMember.findUnique({
      where: {
        userId_chatRoomId: { userId: requesterId, chatRoomId: roomId },
      },
    });

    if (!requesterMembership) {
      throw new ForbiddenException('このチャンネルのメンバーではありません');
    }

    if (requesterMembership.role === MemberRole.MEMBER) {
      throw new ForbiddenException('メンバーをキックする権限がありません');
    }

    // 対象メンバーの確認
    const targetMembership = await this.prisma.channelMember.findUnique({
      where: {
        userId_chatRoomId: { userId: targetUserId, chatRoomId: roomId },
      },
    });

    if (!targetMembership) {
      throw new NotFoundException('対象ユーザーはこのチャンネルのメンバーではありません');
    }

    // オーナーはキックできない
    if (targetMembership.role === MemberRole.OWNER) {
      throw new ForbiddenException('オーナーをキックすることはできません');
    }

    // ADMIN は他の ADMIN をキックできない
    if (
      requesterMembership.role === MemberRole.ADMIN &&
      targetMembership.role === MemberRole.ADMIN
    ) {
      throw new ForbiddenException('管理者は他の管理者をキックできません');
    }

    await this.prisma.channelMember.delete({
      where: {
        userId_chatRoomId: { userId: targetUserId, chatRoomId: roomId },
      },
    });
  }

  /**
   * チャンネルのスター状態を切り替える
   * @param {number} userId - ユーザー ID
   * @param {number} roomId - チャンネル ID
   * @returns {Promise<{ isStarred: boolean }>} 新しいスター状態
   * @throws {NotFoundException} メンバーシップが存在しない場合
   */
  async toggleStar(userId: number, roomId: number): Promise<{ isStarred: boolean }> {
    const membership = await this.prisma.channelMember.findUnique({
      where: {
        userId_chatRoomId: { userId, chatRoomId: roomId },
      },
    });

    if (!membership) {
      throw new NotFoundException('このチャンネルのメンバーではありません');
    }

    const updated = await this.prisma.channelMember.update({
      where: {
        userId_chatRoomId: { userId, chatRoomId: roomId },
      },
      data: {
        isStarred: !membership.isStarred,
      },
    });

    return { isStarred: updated.isStarred };
  }

  /**
   * ユーザーの参加チャンネル一覧を取得する
   * @param {number} userId - ユーザー ID
   * @returns {Promise<ChannelWithMembership[]>} チャンネル一覧（メンバーシップ情報含む）
   */
  async getUserChannels(userId: number): Promise<ChannelWithMembership[]> {
    const memberships = await this.prisma.channelMember.findMany({
      where: { userId },
      include: {
        chatRoom: {
          include: {
            _count: {
              select: { members: true },
            },
          },
        },
      },
      orderBy: [{ isStarred: 'desc' }, { chatRoom: { name: 'asc' } }],
    });

    return memberships.map((m) => ({
      ...m.chatRoom,
      membership: {
        role: m.role,
        isStarred: m.isStarred,
      },
      memberCount: m.chatRoom._count.members,
    }));
  }

  /**
   * 参加可能なチャンネル一覧を取得する（パブリックかつ未参加）
   * @param {number} userId - ユーザー ID
   * @returns {Promise<ChannelWithMembership[]>} チャンネル一覧
   */
  async getDiscoverableChannels(userId: number): Promise<ChannelWithMembership[]> {
    const channels = await this.prisma.chatRoom.findMany({
      where: {
        type: ChannelType.PUBLIC,
        members: {
          none: { userId },
        },
      },
      include: {
        _count: {
          select: { members: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return channels.map((c) => ({
      ...c,
      membership: null,
      memberCount: c._count.members,
    }));
  }

  /**
   * ユーザーがチャンネルにアクセスできるか確認する
   * @param {number} userId - ユーザー ID
   * @param {number} roomId - チャンネル ID
   * @returns {Promise<boolean>} アクセス可能なら true
   */
  async canAccessChannel(userId: number, roomId: number): Promise<boolean> {
    const membership = await this.prisma.channelMember.findUnique({
      where: {
        userId_chatRoomId: { userId, chatRoomId: roomId },
      },
    });

    return !!membership;
  }

  /**
   * チャンネルのメンバー一覧を取得する
   * @param {number} roomId - チャンネル ID
   * @returns {Promise<ChannelMemberWithUser[]>} メンバー一覧
   */
  async getChannelMembers(roomId: number): Promise<ChannelMemberWithUser[]> {
    return this.prisma.channelMember.findMany({
      where: { chatRoomId: roomId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
    });
  }

  /**
   * ユーザーのメンバーシップ情報を取得する
   * @param {number} userId - ユーザー ID
   * @param {number} roomId - チャンネル ID
   * @returns {Promise<ChannelMember | null>} メンバーシップ情報
   */
  async getMembership(userId: number, roomId: number): Promise<ChannelMember | null> {
    return this.prisma.channelMember.findUnique({
      where: {
        userId_chatRoomId: { userId, chatRoomId: roomId },
      },
    });
  }
}
