/**
 * @fileoverview メンバー招待 DTO
 * @description POST /chat-rooms/:id/invite リクエストのバリデーション用 DTO
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, ArrayMinSize, ArrayMaxSize } from 'class-validator';

/**
 * メンバー招待リクエスト DTO
 * @description チャンネルへのメンバー招待時のリクエストボディ定義
 */
export class InviteMembersDto {
  @ApiProperty({
    description: '招待するユーザー ID の配列',
    example: [1, 2, 3],
    type: [Number],
    minItems: 1,
    maxItems: 50,
  })
  @IsArray()
  @IsInt({ each: true, message: 'ユーザー ID は整数で指定してください' })
  @ArrayMinSize(1, { message: '少なくとも1人のユーザーを指定してください' })
  @ArrayMaxSize(50, { message: '一度に招待できるのは50人までです' })
  userIds: number[];
}
