import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * スレッドメッセージ取得クエリ DTO
 */
export class GetThreadDto {
  @ApiPropertyOptional({
    description: '取得件数（1-100）',
    minimum: 1,
    maximum: 100,
    default: 30,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 30;

  @ApiPropertyOptional({
    description: 'カーソル（メッセージ ID）',
    example: 120,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  cursor?: number;

  @ApiPropertyOptional({
    description: '取得方向（older: カーソルより古い、newer: 新しい）',
    enum: ['older', 'newer'],
    default: 'older',
  })
  @IsOptional()
  @IsIn(['older', 'newer'])
  direction?: 'older' | 'newer' = 'older';
}
