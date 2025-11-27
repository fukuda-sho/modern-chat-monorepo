/**
 * @fileoverview チャットルームサービス
 * @description チャットルームの CRUD 操作を提供するサービス
 */

import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChatRoomDto } from './dto';
import { ChatRoom } from '@prisma/client';

/**
 * チャットルームサービスクラス
 * @description チャットルームの作成・取得ロジックを実装
 */
@Injectable()
export class ChatRoomsService {
  /**
   * ChatRoomsService のコンストラクタ
   * @param {PrismaService} prisma - Prisma サービスインスタンス
   */
  constructor(private prisma: PrismaService) {}

  /**
   * 新規チャットルームを作成する
   * @param {CreateChatRoomDto} createChatRoomDto - ルーム作成用 DTO
   * @param {number} userId - 作成者のユーザー ID
   * @returns {Promise<ChatRoom>} 作成されたチャットルーム
   * @throws {ConflictException} ルーム名が既に存在する場合
   */
  async create(createChatRoomDto: CreateChatRoomDto, userId: number): Promise<ChatRoom> {
    // ルーム名の重複チェック
    const existingRoom = await this.prisma.chatRoom.findUnique({
      where: { name: createChatRoomDto.name },
    });

    if (existingRoom) {
      throw new ConflictException('このルーム名は既に使用されています');
    }

    // チャットルームを作成
    return this.prisma.chatRoom.create({
      data: {
        name: createChatRoomDto.name,
        createdByUserId: userId,
      },
    });
  }

  /**
   * 全てのチャットルームを取得する
   * @returns {Promise<ChatRoom[]>} チャットルーム一覧
   */
  async findAll(): Promise<ChatRoom[]> {
    return this.prisma.chatRoom.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * ID でチャットルームを取得する
   * @param {number} id - チャットルーム ID
   * @returns {Promise<ChatRoom | null>} チャットルーム（存在しない場合は null）
   */
  async findById(id: number): Promise<ChatRoom | null> {
    return this.prisma.chatRoom.findUnique({
      where: { id },
    });
  }
}
