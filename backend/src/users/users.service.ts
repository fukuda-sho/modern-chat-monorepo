/**
 * @fileoverview ユーザーサービス
 * @description ユーザー情報取得のビジネスロジックを提供
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * パスワードを除外したユーザー情報の型定義
 */
interface UserWithoutPassword {
  id: number;
  username: string;
  email: string;
  createdAt: Date;
}

/**
 * ユーザーサービスクラス
 * @description ユーザー情報取得のビジネスロジックを実装
 */
@Injectable()
export class UsersService {
  /**
   * UsersService のコンストラクタ
   * @param {PrismaService} prisma - Prisma サービスインスタンス
   */
  constructor(private prisma: PrismaService) {}

  /**
   * ID でユーザーを検索する
   * @param {number} id - ユーザー ID
   * @returns {Promise<UserWithoutPassword>} パスワードを除外したユーザー情報
   * @throws {NotFoundException} ユーザーが存在しない場合
   */
  async findById(id: number): Promise<UserWithoutPassword> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // パスワードを除外して返却
    const { password: _, ...result } = user;
    return result;
  }
}
