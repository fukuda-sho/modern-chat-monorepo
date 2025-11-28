import { ApiProperty } from '@nestjs/swagger';
import { MessageDto, PaginationDto } from './message.dto';

/**
 * スレッドメッセージレスポンス DTO
 */
export class ThreadMessagesResponseDto {
  @ApiProperty({
    description: '親メッセージ',
    type: MessageDto,
  })
  parent: MessageDto;

  @ApiProperty({
    description: 'スレッド内メッセージ一覧',
    type: [MessageDto],
  })
  replies: MessageDto[];

  @ApiProperty({
    description: 'ページネーション情報',
    type: PaginationDto,
  })
  pagination: PaginationDto;
}
