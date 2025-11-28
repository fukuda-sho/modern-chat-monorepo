/**
 * @fileoverview メッセージ関連 DTO
 * @description メッセージ履歴 API のレスポンス型定義
 */

import { ApiProperty } from '@nestjs/swagger';

/**
 * ユーザー簡易情報 DTO
 * @description メッセージに含まれるユーザー情報
 */
export class UserBriefDto {
  @ApiProperty({
    description: 'ユーザー ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ユーザー名',
    example: 'john_doe',
  })
  username: string;

  @ApiProperty({
    description: 'メールアドレス',
    example: 'john@example.com',
  })
  email: string;
}

/**
 * メッセージ DTO
 * @description API レスポンスのメッセージ形式
 */
export class MessageDto {
  @ApiProperty({
    description: 'メッセージ ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'メッセージ内容',
    example: 'Hello, world!',
  })
  content: string;

  @ApiProperty({
    description: 'ルーム ID',
    example: 1,
  })
  roomId: number;

  @ApiProperty({
    description: '送信者ユーザー ID',
    example: 1,
  })
  userId: number;

  @ApiProperty({
    description: '送信者ユーザー情報',
    type: UserBriefDto,
  })
  user: UserBriefDto;

  @ApiProperty({
    description: '作成日時（ISO 8601 形式）',
    example: '2025-11-27T10:30:00.000Z',
  })
  createdAt: string;
}

/**
 * ページネーション情報 DTO
 * @description カーソルベースのページネーション情報
 */
export class PaginationDto {
  @ApiProperty({
    description: 'さらにデータがあるかどうか',
    example: true,
  })
  hasMore: boolean;

  @ApiProperty({
    description: '次ページのカーソル（古い方向）',
    nullable: true,
    example: 99,
  })
  nextCursor: number | null;

  @ApiProperty({
    description: '前ページのカーソル（新しい方向）',
    nullable: true,
    example: 150,
  })
  prevCursor: number | null;
}

/**
 * メッセージ履歴レスポンス DTO
 * @description メッセージ履歴 API のレスポンス形式
 */
export class MessageHistoryResponseDto {
  @ApiProperty({
    description: 'メッセージ一覧',
    type: [MessageDto],
  })
  data: MessageDto[];

  @ApiProperty({
    description: 'ページネーション情報',
    type: PaginationDto,
  })
  pagination: PaginationDto;
}
