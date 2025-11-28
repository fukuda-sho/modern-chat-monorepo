/**
 * @fileoverview メッセージアクション関連 DTO
 * @description メッセージ編集・削除・リアクションの入出力型定義
 */

import { IsInt, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * メッセージ編集リクエスト DTO
 */
export class EditMessageDto {
  @ApiProperty({
    description: 'メッセージ ID',
    example: 1,
  })
  @IsInt()
  messageId: number;

  @ApiProperty({
    description: '新しいメッセージ内容',
    example: '編集後のメッセージ',
    minLength: 1,
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(2000)
  content: string;
}

/**
 * メッセージ削除リクエスト DTO
 */
export class DeleteMessageDto {
  @ApiProperty({
    description: 'メッセージ ID',
    example: 1,
  })
  @IsInt()
  messageId: number;
}

/**
 * リアクション追加リクエスト DTO
 */
export class AddReactionDto {
  @ApiProperty({
    description: 'メッセージ ID',
    example: 1,
  })
  @IsInt()
  messageId: number;

  @ApiProperty({
    description: '絵文字（Unicode または shortcode）',
    example: '👍',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  emoji: string;
}

/**
 * リアクション削除リクエスト DTO
 */
export class RemoveReactionDto {
  @ApiProperty({
    description: 'メッセージ ID',
    example: 1,
  })
  @IsInt()
  messageId: number;

  @ApiProperty({
    description: '絵文字（Unicode または shortcode）',
    example: '👍',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  emoji: string;
}

/**
 * メッセージ更新イベントペイロード
 */
export class MessageUpdatedPayload {
  @ApiProperty({ description: 'メッセージ ID' })
  id: number;

  @ApiProperty({ description: 'ルーム ID' })
  roomId: number;

  @ApiProperty({ description: '新しいメッセージ内容' })
  content: string;

  @ApiProperty({ description: '編集済みフラグ' })
  isEdited: boolean;

  @ApiProperty({ description: '編集日時' })
  editedAt: string;
}

/**
 * メッセージ削除イベントペイロード
 */
export class MessageDeletedPayload {
  @ApiProperty({ description: 'メッセージ ID' })
  id: number;

  @ApiProperty({ description: 'ルーム ID' })
  roomId: number;
}

/**
 * リアクション追加イベントペイロード
 */
export class ReactionAddedPayload {
  @ApiProperty({ description: 'メッセージ ID' })
  messageId: number;

  @ApiProperty({ description: 'ルーム ID' })
  roomId: number;

  @ApiProperty({ description: '絵文字' })
  emoji: string;

  @ApiProperty({ description: 'ユーザー ID' })
  userId: number;

  @ApiProperty({ description: 'ユーザー名' })
  username: string;
}

/**
 * リアクション削除イベントペイロード
 */
export class ReactionRemovedPayload {
  @ApiProperty({ description: 'メッセージ ID' })
  messageId: number;

  @ApiProperty({ description: 'ルーム ID' })
  roomId: number;

  @ApiProperty({ description: '絵文字' })
  emoji: string;

  @ApiProperty({ description: 'ユーザー ID' })
  userId: number;
}

/**
 * リアクション情報（メッセージに含まれる）
 */
export class ReactionDto {
  @ApiProperty({ description: '絵文字' })
  emoji: string;

  @ApiProperty({ description: 'リアクション数' })
  count: number;

  @ApiProperty({ description: 'リアクションしたユーザー ID 一覧' })
  userIds: number[];
}
