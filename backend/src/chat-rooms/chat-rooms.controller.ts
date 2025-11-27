/**
 * @fileoverview チャットルームコントローラー
 * @description /chat-rooms エンドポイントのルーティングを定義
 */

import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ChatRoomsService } from './chat-rooms.service';
import { CreateChatRoomDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { ApiErrorResponseDto, UnauthorizedResponseDto, ConflictResponseDto } from '../common/dto';

/**
 * 認証済みリクエストの型定義
 * @description request.user を含むリクエストオブジェクト
 */
interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}

/**
 * チャットルームコントローラークラス
 * @description チャットルームの作成・取得エンドポイントを提供
 */
@ApiTags('chat-rooms')
@ApiBearerAuth('access-token')
@Controller('chat-rooms')
@UseGuards(JwtAuthGuard)
export class ChatRoomsController {
  /**
   * ChatRoomsController のコンストラクタ
   * @param {ChatRoomsService} chatRoomsService - チャットルームサービスインスタンス
   */
  constructor(private chatRoomsService: ChatRoomsService) {}

  /**
   * 新規チャットルームを作成する
   * @param {RequestWithUser} req - 認証済みリクエスト
   * @param {CreateChatRoomDto} createChatRoomDto - ルーム作成用 DTO
   * @returns {Promise<object>} 作成されたチャットルーム情報
   */
  @Post()
  @ApiOperation({
    summary: 'チャットルーム作成',
    description: '新規チャットルームを作成します。ルーム名は一意である必要があります。',
  })
  @ApiResponse({
    status: 201,
    description: '作成成功。チャットルーム情報を返却。',
  })
  @ApiResponse({
    status: 400,
    description: 'バリデーションエラー（入力形式が不正）',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '未認証（トークンが無効または期限切れ）',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'ルーム名の重複',
    type: ConflictResponseDto,
  })
  async create(
    @Request() req: RequestWithUser,
    @Body() createChatRoomDto: CreateChatRoomDto,
  ): Promise<object> {
    return this.chatRoomsService.create(createChatRoomDto, req.user.id);
  }

  /**
   * 全てのチャットルームを取得する
   * @returns {Promise<object[]>} チャットルーム一覧
   */
  @Get()
  @ApiOperation({
    summary: 'チャットルーム一覧取得',
    description: '全てのチャットルームを取得します。',
  })
  @ApiResponse({
    status: 200,
    description: '取得成功。チャットルーム一覧を返却。',
  })
  @ApiResponse({
    status: 401,
    description: '未認証（トークンが無効または期限切れ）',
    type: UnauthorizedResponseDto,
  })
  async findAll(): Promise<object[]> {
    return this.chatRoomsService.findAll();
  }
}
