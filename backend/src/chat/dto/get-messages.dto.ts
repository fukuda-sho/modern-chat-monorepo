/**
 * @fileoverview メッセージ履歴取得 DTO
 * @description メッセージ履歴 API のクエリパラメータバリデーション
 */

import { IsOptional, IsInt, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * メッセージ履歴取得リクエストの DTO
 * @description カーソルベースのページネーションに対応
 */
export class GetMessagesDto {
  @ApiPropertyOptional({
    description: '取得件数',
    minimum: 1,
    maximum: 100,
    default: 50,
    example: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @ApiPropertyOptional({
    description: 'ページネーションカーソル（メッセージ ID）',
    example: 123,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  cursor?: number;

  @ApiPropertyOptional({
    description: 'カーソルからの取得方向',
    enum: ['older', 'newer'],
    default: 'older',
    example: 'older',
  })
  @IsOptional()
  @IsIn(['older', 'newer'])
  direction?: 'older' | 'newer' = 'older';
}
