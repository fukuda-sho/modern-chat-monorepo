/**
 * @fileoverview Chat サービス
 * @description チャット関連のビジネスロジックを提供
 */

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ChannelMembershipService } from '../chat-rooms/channel-membership.service';
import { GetMessagesDto } from './dto/get-messages.dto';
import { MessageHistoryResponseDto, MessageDto, ReactionSummaryDto } from './dto/message.dto';
import { GetThreadDto } from './dto/get-thread.dto';
import { ThreadMessagesResponseDto } from './dto/thread.dto';

const messageSelect = {
  id: true,
  content: true,
  userId: true,
  chatRoomId: true,
  createdAt: true,
  parentMessageId: true,
  threadReplyCount: true,
  threadLastRepliedAt: true,
  threadLastRepliedBy: true,
  isEdited: true,
  editedAt: true,
  isDeleted: true,
  deletedAt: true,
  user: { select: { id: true, username: true, email: true } },
  reactions: { select: { emoji: true, userId: true } },
  threadLastRepliedByUser: { select: { id: true, username: true, email: true } },
} as const;

type MessageWithRelations = Prisma.MessageGetPayload<{ select: typeof messageSelect }>;

/**
 * Chat サービスクラス
 */
@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membershipService: ChannelMembershipService,
  ) {}

  private mapMessageToDto(msg: MessageWithRelations): MessageDto {
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
      parentMessageId: msg.parentMessageId ?? null,
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
      threadReplyCount: msg.threadReplyCount ?? 0,
      threadLastRepliedAt: msg.threadLastRepliedAt?.toISOString() ?? null,
      threadLastRepliedBy: msg.threadLastRepliedBy ?? null,
      threadLastRepliedByUser: msg.threadLastRepliedByUser
        ? {
            id: msg.threadLastRepliedByUser.id,
            username: msg.threadLastRepliedByUser.username,
            email: msg.threadLastRepliedByUser.email,
          }
        : null,
      reactions,
    };
  }

  /**
   * ルームのメッセージ履歴を取得（親メッセージのみ）
   */
  async getMessageHistory(
    roomId: number,
    userId: number,
    options: GetMessagesDto,
  ): Promise<MessageHistoryResponseDto> {
    const { limit = 50, cursor, direction = 'older' } = options;

    const room = await this.prisma.chatRoom.findUnique({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const canAccess = await this.membershipService.canAccessChannel(userId, roomId);
    if (!canAccess) {
      throw new ForbiddenException("You don't have access to this room");
    }

    let cursorMessage: { createdAt: Date; id: number } | null = null;
    if (cursor) {
      cursorMessage = await this.prisma.message.findUnique({
        where: { id: cursor },
        select: { createdAt: true, id: true },
      });
    }

    const messages = await this.prisma.message.findMany({
      where: {
        chatRoomId: roomId,
        parentMessageId: null,
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
      select: messageSelect,
      orderBy: [
        { createdAt: direction === 'older' ? 'desc' : 'asc' },
        { id: direction === 'older' ? 'desc' : 'asc' },
      ],
      take: limit + 1,
    });

    const hasMore = messages.length > limit;
    const resultMessages = hasMore ? messages.slice(0, limit) : messages;
    if (direction === 'newer') {
      resultMessages.reverse();
    }

    const data: MessageDto[] = resultMessages.map((msg) => this.mapMessageToDto(msg));
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
   * スレッドメッセージを取得
   */
  async getThreadMessages(
    parentMessageId: number,
    userId: number,
    options: GetThreadDto,
  ): Promise<ThreadMessagesResponseDto> {
    const { limit = 30, cursor, direction = 'older' } = options;

    const parent = await this.prisma.message.findUnique({
      where: { id: parentMessageId },
      select: messageSelect,
    });

    if (!parent) {
      throw new NotFoundException('Parent message not found');
    }
    if (parent.parentMessageId) {
      throw new ForbiddenException('Replies to thread replies are not supported');
    }

    const canAccess = await this.membershipService.canAccessChannel(userId, parent.chatRoomId);
    if (!canAccess) {
      throw new ForbiddenException("You don't have access to this room");
    }

    let cursorMessage: { createdAt: Date; id: number } | null = null;
    if (cursor) {
      cursorMessage = await this.prisma.message.findUnique({
        where: { id: cursor },
        select: { createdAt: true, id: true },
      });
    }

    const replies = await this.prisma.message.findMany({
      where: {
        parentMessageId,
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
      select: messageSelect,
      orderBy: [
        { createdAt: direction === 'older' ? 'desc' : 'asc' },
        { id: direction === 'older' ? 'desc' : 'asc' },
      ],
      take: limit + 1,
    });

    const hasMore = replies.length > limit;
    const resultReplies = hasMore ? replies.slice(0, limit) : replies;
    if (direction === 'newer') {
      resultReplies.reverse();
    }

    const replyDtos = resultReplies.map((reply) => this.mapMessageToDto(reply));
    const first = replyDtos[0];
    const last = replyDtos[replyDtos.length - 1];

    return {
      parent: this.mapMessageToDto(parent),
      replies: replyDtos,
      pagination: {
        hasMore,
        nextCursor: hasMore && last ? last.id : null,
        prevCursor: first ? first.id : null,
      },
    };
  }

  /**
   * スレッド返信を作成
   */
  async createThreadReply(
    parentMessageId: number,
    userId: number,
    content: string,
  ): Promise<{
    reply: MessageWithRelations;
    roomId: number;
    replyDto: MessageDto;
    threadSummary: { threadReplyCount: number; threadLastRepliedAt: Date; threadLastRepliedBy: number };
  }> {
    const parent = await this.prisma.message.findUnique({
      where: { id: parentMessageId },
      select: {
        id: true,
        chatRoomId: true,
        parentMessageId: true,
        isDeleted: true,
      },
    });

    if (!parent) {
      throw new NotFoundException('Parent message not found');
    }
    if (parent.parentMessageId) {
      throw new ForbiddenException('Replies to thread replies are not supported');
    }
    if (parent.isDeleted) {
      throw new ForbiddenException('Cannot reply to a deleted message');
    }

    const canAccess = await this.membershipService.canAccessChannel(userId, parent.chatRoomId);
    if (!canAccess) {
      throw new ForbiddenException("You don't have access to this room");
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const reply = await tx.message.create({
        data: {
          content,
          userId,
          chatRoomId: parent.chatRoomId,
          parentMessageId,
        },
        select: messageSelect,
      });

      const updatedParent = await tx.message.update({
        where: { id: parentMessageId },
        data: {
          threadReplyCount: { increment: 1 },
          threadLastRepliedAt: reply.createdAt,
          threadLastRepliedBy: userId,
        },
        select: {
          threadReplyCount: true,
          threadLastRepliedAt: true,
          threadLastRepliedBy: true,
        },
      });

      return { reply, updatedParent };
    });

    return {
      reply: result.reply,
      roomId: parent.chatRoomId,
      replyDto: this.mapMessageToDto(result.reply),
      threadSummary: {
        threadReplyCount: result.updatedParent.threadReplyCount,
        threadLastRepliedAt: result.updatedParent.threadLastRepliedAt!,
        threadLastRepliedBy: result.updatedParent.threadLastRepliedBy!,
      },
    };
  }

  /**
   * メッセージを編集
   */
  async editMessage(
    messageId: number,
    userId: number,
    content: string,
  ): Promise<{
    id: number;
    roomId: number;
    parentMessageId: number | null;
    content: string;
    isEdited: boolean;
    editedAt: string;
  }> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        userId: true,
        chatRoomId: true,
        isDeleted: true,
        parentMessageId: true,
      },
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
      parentMessageId: message.parentMessageId ?? null,
      content: updated.content,
      isEdited: updated.isEdited,
      editedAt: updated.editedAt!.toISOString(),
    };
  }

  /**
   * メッセージを削除（ソフトデリート）
   */
  async deleteMessage(
    messageId: number,
    userId: number,
  ): Promise<{
    id: number;
    roomId: number;
    parentMessageId: number | null;
    threadSummary?: {
      threadReplyCount: number;
      threadLastRepliedAt: string | null;
      threadLastRepliedBy: number | null;
    };
  }> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        userId: true,
        chatRoomId: true,
        parentMessageId: true,
        isDeleted: true,
      },
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

    let threadSummary:
      | {
          threadReplyCount: number;
          threadLastRepliedAt: string | null;
          threadLastRepliedBy: number | null;
        }
      | null = null;

    if (message.parentMessageId) {
      const summary = await this.recalculateThreadSummary(message.parentMessageId);
      threadSummary = {
        threadReplyCount: summary.threadReplyCount,
        threadLastRepliedAt: summary.threadLastRepliedAt
          ? summary.threadLastRepliedAt.toISOString()
          : null,
        threadLastRepliedBy: summary.threadLastRepliedBy ?? null,
      };
    }

    return {
      id: message.id,
      roomId: message.chatRoomId,
      parentMessageId: message.parentMessageId ?? null,
      threadSummary: threadSummary ?? undefined,
    };
  }

  /**
   * リアクションを追加
   */
  async addReaction(
    messageId: number,
    userId: number,
    emoji: string,
  ): Promise<{
    messageId: number;
    roomId: number;
    parentMessageId: number | null;
    emoji: string;
    userId: number;
    username: string;
  }> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        chatRoomId: true,
        parentMessageId: true,
      },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const canAccess = await this.membershipService.canAccessChannel(userId, message.chatRoomId);
    if (!canAccess) {
      throw new ForbiddenException("You don't have access to this room");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { username: true },
    });

    await this.prisma.reaction.upsert({
      where: {
        userId_messageId_emoji: {
          userId,
          messageId,
          emoji,
        },
      },
      update: {},
      create: {
        userId,
        messageId,
        emoji,
      },
    });

    return {
      messageId,
      roomId: message.chatRoomId,
      parentMessageId: message.parentMessageId ?? null,
      emoji,
      userId,
      username: user!.username,
    };
  }

  /**
   * リアクションを削除
   */
  async removeReaction(
    messageId: number,
    userId: number,
    emoji: string,
  ): Promise<{
    messageId: number;
    roomId: number;
    parentMessageId: number | null;
    emoji: string;
    userId: number;
  }> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        chatRoomId: true,
        parentMessageId: true,
      },
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
      parentMessageId: message.parentMessageId ?? null,
      emoji,
      userId,
    };
  }

  /**
   * スレッド集計を再計算
   */
  private async recalculateThreadSummary(
    parentMessageId: number,
  ): Promise<{ threadReplyCount: number; threadLastRepliedAt: Date | null; threadLastRepliedBy: number | null }> {
    const [count, lastReply] = await this.prisma.$transaction([
      this.prisma.message.count({
        where: {
          parentMessageId,
          isDeleted: false,
        },
      }),
      this.prisma.message.findFirst({
        where: {
          parentMessageId,
          isDeleted: false,
        },
        orderBy: [
          { createdAt: 'desc' },
          { id: 'desc' },
        ],
        select: {
          createdAt: true,
          userId: true,
        },
      }),
    ]);

    await this.prisma.message.update({
      where: { id: parentMessageId },
      data: {
        threadReplyCount: count,
        threadLastRepliedAt: lastReply?.createdAt ?? null,
        threadLastRepliedBy: lastReply?.userId ?? null,
      },
    });

    return {
      threadReplyCount: count,
      threadLastRepliedAt: lastReply?.createdAt ?? null,
      threadLastRepliedBy: lastReply?.userId ?? null,
    };
  }
}
