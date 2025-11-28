/**
 * @fileoverview Chat サービス
 * @description チャット関連のビジネスロジックを提供
 */

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChannelMembershipService } from '../chat-rooms/channel-membership.service';
import { GetMessagesDto } from './dto/get-messages.dto';
import { MessageHistoryResponseDto, MessageDto, ReactionSummaryDto } from './dto/message.dto';

/**
 * Chat サービスクラス
 * @description メッセージ履歴取得などのチャット関連機能を提供
 */
@Injectable()
export class ChatService {
  /**
   * ChatService のコンストラクタ
   * @param {PrismaService} prisma - Prisma サービスインスタンス
   * @param {ChannelMembershipService} membershipService - メンバーシップサービスインスタンス
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly membershipService: ChannelMembershipService,
  ) {}

  /**
   * ルームのメッセージ履歴を取得
   * @param {number} roomId - ルーム ID
   * @param {number} userId - リクエストユーザー ID
   * @param {GetMessagesDto} options - ページネーションオプション
   * @returns {Promise<MessageHistoryResponseDto>} メッセージ履歴とページネーション情報
   * @throws {NotFoundException} ルームが存在しない場合
   * @throws {ForbiddenException} アクセス権がない場合
   */
  async getMessageHistory(
    roomId: number,
    userId: number,
    options: GetMessagesDto,
  ): Promise<MessageHistoryResponseDto> {
    const { limit = 50, cursor, direction = 'older' } = options;

    // ルームの存在確認
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // アクセス権チェック
    const canAccess = await this.membershipService.canAccessChannel(userId, roomId);
    if (!canAccess) {
      throw new ForbiddenException("You don't have access to this room");
    }

    // カーソルの基準となるメッセージを取得
    let cursorMessage: { createdAt: Date; id: number } | null = null;
    if (cursor) {
      cursorMessage = await this.prisma.message.findUnique({
        where: { id: cursor },
        select: { createdAt: true, id: true },
      });
    }

    // メッセージを取得（limit + 1 件取得して hasMore を判定）
    const messages = await this.prisma.message.findMany({
      where: {
        chatRoomId: roomId,
        ...(cursorMessage && {
          OR: [
            {
              createdAt:
                direction === 'older'
                  ? { lt: cursorMessage.createdAt }
                  : { gt: cursorMessage.createdAt },
            },
            {
              createdAt: cursorMessage.createdAt,
              id: direction === 'older' ? { lt: cursorMessage.id } : { gt: cursorMessage.id },
            },
          ],
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        reactions: {
          select: {
            emoji: true,
            userId: true,
          },
        },
      },
      orderBy: [
        { createdAt: direction === 'older' ? 'desc' : 'asc' },
        { id: direction === 'older' ? 'desc' : 'asc' },
      ],
      take: limit + 1,
    });

    // hasMore の判定
    const hasMore = messages.length > limit;
    const resultMessages = hasMore ? messages.slice(0, limit) : messages;

    // direction が 'newer' の場合は古い順に並べ替え（時系列順）
    if (direction === 'newer') {
      resultMessages.reverse();
    }

    // レスポンス用に整形
    const data: MessageDto[] = resultMessages.map((msg) => {
      // リアクションを絵文字ごとに集計
      const reactionMap = new Map<string, number[]>();
      for (const reaction of msg.reactions) {
        const userIds = reactionMap.get(reaction.emoji) || [];
        userIds.push(reaction.userId);
        reactionMap.set(reaction.emoji, userIds);
      }
      const reactions: ReactionSummaryDto[] = Array.from(reactionMap.entries()).map(
        ([emoji, userIds]) => ({
          emoji,
          count: userIds.length,
          userIds,
        }),
      );

      return {
        id: msg.id,
        content: msg.isDeleted ? '' : msg.content,
        roomId: msg.chatRoomId,
        userId: msg.userId,
        user: {
          id: msg.user.id,
          username: msg.user.username,
          email: msg.user.email,
        },
        createdAt: msg.createdAt.toISOString(),
        isEdited: msg.isEdited,
        editedAt: msg.editedAt?.toISOString() ?? null,
        isDeleted: msg.isDeleted,
        reactions,
      };
    });

    // ページネーション情報
    const firstMsg = data[0];
    const lastMsg = data[data.length - 1];

    return {
      data,
      pagination: {
        hasMore,
        nextCursor: hasMore && lastMsg ? lastMsg.id : null,
        prevCursor: firstMsg ? firstMsg.id : null,
      },
    };
  }

  /**
   * メッセージを編集
   * @param {number} messageId - メッセージ ID
   * @param {number} userId - リクエストユーザー ID
   * @param {string} content - 新しいメッセージ内容
   * @returns {Promise<{id: number; roomId: number; content: string; isEdited: boolean; editedAt: string}>}
   * @throws {NotFoundException} メッセージが存在しない場合
   * @throws {ForbiddenException} 編集権限がない場合
   */
  async editMessage(
    messageId: number,
    userId: number,
    content: string,
  ): Promise<{ id: number; roomId: number; content: string; isEdited: boolean; editedAt: string }> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.userId !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    if (message.isDeleted) {
      throw new ForbiddenException('Cannot edit a deleted message');
    }

    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        content,
        isEdited: true,
        editedAt: new Date(),
      },
    });

    return {
      id: updated.id,
      roomId: updated.chatRoomId,
      content: updated.content,
      isEdited: updated.isEdited,
      editedAt: updated.editedAt!.toISOString(),
    };
  }

  /**
   * メッセージを削除（ソフトデリート）
   * @param {number} messageId - メッセージ ID
   * @param {number} userId - リクエストユーザー ID
   * @returns {Promise<{id: number; roomId: number}>}
   * @throws {NotFoundException} メッセージが存在しない場合
   * @throws {ForbiddenException} 削除権限がない場合
   */
  async deleteMessage(
    messageId: number,
    userId: number,
  ): Promise<{ id: number; roomId: number }> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.userId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    if (message.isDeleted) {
      throw new ForbiddenException('Message is already deleted');
    }

    await this.prisma.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return {
      id: message.id,
      roomId: message.chatRoomId,
    };
  }

  /**
   * リアクションを追加
   * @param {number} messageId - メッセージ ID
   * @param {number} userId - ユーザー ID
   * @param {string} emoji - 絵文字
   * @returns {Promise<{messageId: number; roomId: number; emoji: string; userId: number; username: string}>}
   * @throws {NotFoundException} メッセージが存在しない場合
   * @throws {ForbiddenException} アクセス権がない場合
   */
  async addReaction(
    messageId: number,
    userId: number,
    emoji: string,
  ): Promise<{
    messageId: number;
    roomId: number;
    emoji: string;
    userId: number;
    username: string;
  }> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { chatRoom: true },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // アクセス権チェック
    const canAccess = await this.membershipService.canAccessChannel(userId, message.chatRoomId);
    if (!canAccess) {
      throw new ForbiddenException("You don't have access to this room");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { username: true },
    });

    // upsert で既存リアクションがあっても問題なく処理
    await this.prisma.reaction.upsert({
      where: {
        userId_messageId_emoji: {
          userId,
          messageId,
          emoji,
        },
      },
      update: {}, // 既存なら何もしない
      create: {
        userId,
        messageId,
        emoji,
      },
    });

    return {
      messageId,
      roomId: message.chatRoomId,
      emoji,
      userId,
      username: user!.username,
    };
  }

  /**
   * リアクションを削除
   * @param {number} messageId - メッセージ ID
   * @param {number} userId - ユーザー ID
   * @param {string} emoji - 絵文字
   * @returns {Promise<{messageId: number; roomId: number; emoji: string; userId: number}>}
   * @throws {NotFoundException} メッセージまたはリアクションが存在しない場合
   */
  async removeReaction(
    messageId: number,
    userId: number,
    emoji: string,
  ): Promise<{ messageId: number; roomId: number; emoji: string; userId: number }> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const reaction = await this.prisma.reaction.findUnique({
      where: {
        userId_messageId_emoji: {
          userId,
          messageId,
          emoji,
        },
      },
    });

    if (!reaction) {
      throw new NotFoundException('Reaction not found');
    }

    await this.prisma.reaction.delete({
      where: { id: reaction.id },
    });

    return {
      messageId,
      roomId: message.chatRoomId,
      emoji,
      userId,
    };
  }
}
