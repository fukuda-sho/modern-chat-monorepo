import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * スレッド返信作成 DTO
 */
export class CreateThreadReplyDto {
  @ApiProperty({
    description: '返信内容',
    example: '了解です、進めます！',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  content: string;
}
