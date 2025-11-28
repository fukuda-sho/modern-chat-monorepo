/**
 * @fileoverview Chat サービス
 * @description チャット関連のビジネスロジックを提供
 */

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChannelMembershipService } from '../chat-rooms/channel-membership.service';
import { GetMessagesDto } from './dto/get-messages.dto';
import { MessageHistoryResponseDto, MessageDto } from './dto/message.dto';

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
    const data: MessageDto[] = resultMessages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      roomId: msg.chatRoomId,
      userId: msg.userId,
      user: {
        id: msg.user.id,
        username: msg.user.username,
        email: msg.user.email,
      },
      createdAt: msg.createdAt.toISOString(),
    }));

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
}
