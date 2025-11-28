/**
 * @fileoverview Chat コントローラー
 * @description チャット関連の REST API エンドポイントを提供
 */

import { Body, Controller, Get, Param, Post, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { ChatService } from './chat.service';
import { GetMessagesDto } from './dto/get-messages.dto';
import { MessageHistoryResponseDto, MessageDto } from './dto/message.dto';
import { GetThreadDto } from './dto/get-thread.dto';
import { ThreadMessagesResponseDto } from './dto/thread.dto';
import { CreateThreadReplyDto } from './dto/create-thread-reply.dto';

/**
 * Chat コントローラークラス
 * @description メッセージ履歴取得などの REST API を提供
 */
@ApiTags('chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  /**
   * ChatController のコンストラクタ
   * @param {ChatService} chatService - Chat サービスインスタンス
   */
  constructor(private readonly chatService: ChatService) {}

  /**
   * ルームのメッセージ履歴を取得
   * @param {number} roomId - ルーム ID
   * @param {GetMessagesDto} query - ページネーションオプション
   * @param {AuthenticatedUser} user - 認証済みユーザー
   * @returns {Promise<MessageHistoryResponseDto>} メッセージ履歴
   */
  @Get('rooms/:roomId/messages')
  @ApiOperation({
    summary: 'ルームのメッセージ履歴を取得',
    description: 'カーソルベースのページネーションでメッセージ履歴を取得します',
  })
  @ApiParam({
    name: 'roomId',
    description: 'チャットルーム ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'メッセージ履歴',
    type: MessageHistoryResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'バリデーションエラー（limit が 1〜100 の範囲外など）',
  })
  @ApiResponse({
    status: 401,
    description: '未認証',
  })
  @ApiResponse({
    status: 403,
    description: 'アクセス権限なし',
  })
  @ApiResponse({
    status: 404,
    description: 'ルームが見つかりません',
  })
  async getMessages(
    @Param('roomId', ParseIntPipe) roomId: number,
    @Query() query: GetMessagesDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MessageHistoryResponseDto> {
    return this.chatService.getMessageHistory(roomId, user.id, query);
  }

  /**
   * スレッドメッセージを取得
   * @param {number} messageId - 親メッセージ ID
   * @param {GetThreadDto} query - ページネーション
   * @param {AuthenticatedUser} user - 認証ユーザー
   */
  @Get('messages/:messageId/thread')
  @ApiOperation({
    summary: 'スレッドメッセージを取得',
    description: '親メッセージに紐づくスレッド返信を取得します',
  })
  @ApiParam({
    name: 'messageId',
    description: '親メッセージ ID',
    type: Number,
    example: 10,
  })
  @ApiResponse({ status: 200, description: 'スレッドメッセージ', type: ThreadMessagesResponseDto })
  async getThreadMessages(
    @Param('messageId', ParseIntPipe) messageId: number,
    @Query() query: GetThreadDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ThreadMessagesResponseDto> {
    return this.chatService.getThreadMessages(messageId, user.id, query);
  }

  /**
   * スレッド返信を作成
   * @param {number} messageId - 親メッセージ ID
   * @param {CreateThreadReplyDto} body - 返信内容
   * @param {AuthenticatedUser} user - 認証ユーザー
   */
  @Post('messages/:messageId/thread')
  @ApiOperation({
    summary: 'スレッド返信を作成',
    description: '親メッセージに対してスレッド返信を作成します',
  })
  @ApiParam({
    name: 'messageId',
    description: '親メッセージ ID',
    type: Number,
  })
  @ApiResponse({ status: 201, description: '作成されたスレッド返信', type: MessageDto })
  async createThreadReply(
    @Param('messageId', ParseIntPipe) messageId: number,
    @Body() body: CreateThreadReplyDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MessageDto> {
    const result = await this.chatService.createThreadReply(messageId, user.id, body.content);
    return result.replyDto;
  }
}
