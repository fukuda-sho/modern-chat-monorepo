import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * チャット機能のビジネスロジックを提供するサービス
 *
 * メッセージの保存、取得などチャットルームに関する操作を管理します。
 */
@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  /**
   * チャットメッセージをデータベースに保存します
   *
   * 送信されたメッセージを永続化し、送信者のユーザー情報を含めて返却します。
   * トランザクションは使用されないため、複数のメッセージを同時に保存する場合は
   * 呼び出し側でトランザクション制御を行う必要があります。
   *
   * @param userId メッセージ送信者のユーザーID
   * @param roomId メッセージを送信するチャットルームのID
   * @param content メッセージの本文
   * @returns 保存されたメッセージオブジェクト（送信者のユーザー名とメールアドレスを含む）
   * @throws Error データベースエラーが発生した場合、またはユーザーやルームが存在しない場合
   */
  async saveMessage(userId: number, roomId: number, content: string) {
    return this.prisma.message.create({
      data: {
        userId,
        chatRoomId: roomId,
        content,
      },
      include: {
        user: {
          select: { username: true, email: true },
        },
      },
    });
  }
}
