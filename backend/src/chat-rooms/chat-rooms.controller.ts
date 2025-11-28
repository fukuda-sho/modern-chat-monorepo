/**
 * @fileoverview チャットルームコントローラー
 * @description /chat-rooms エンドポイントのルーティングを定義
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  NotFoundException,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ChatRoomsService } from './chat-rooms.service';
import { ChannelMembershipService } from './channel-membership.service';
import { CreateChatRoomDto, InviteMembersDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import {
  ApiErrorResponseDto,
  UnauthorizedResponseDto,
  ConflictResponseDto,
  NotFoundResponseDto,
  ForbiddenResponseDto,
} from '../common/dto';

/**
 * 認証済みリクエストの型定義
 * @description request.user を含むリクエストオブジェクト
 */
interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}

/**
 * チャットルームコントローラークラス
 * @description チャットルームの作成・取得・メンバーシップ管理エンドポイントを提供
 */
@ApiTags('chat-rooms')
@ApiBearerAuth('access-token')
@Controller('chat-rooms')
@UseGuards(JwtAuthGuard)
export class ChatRoomsController {
  /**
   * ChatRoomsController のコンストラクタ
   * @param {ChatRoomsService} chatRoomsService - チャットルームサービスインスタンス
   * @param {ChannelMembershipService} membershipService - メンバーシップサービスインスタンス
   */
  constructor(
    private chatRoomsService: ChatRoomsService,
    private membershipService: ChannelMembershipService,
  ) {}

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
   * ユーザーの参加チャンネル一覧を取得する
   * @param {RequestWithUser} req - 認証済みリクエスト
   * @returns {Promise<object[]>} 参加チャンネル一覧
   */
  @Get()
  @ApiOperation({
    summary: '参加チャンネル一覧取得',
    description: 'ユーザーが参加しているチャンネル一覧を取得します。',
  })
  @ApiResponse({
    status: 200,
    description: '取得成功。参加チャンネル一覧を返却。',
  })
  @ApiResponse({
    status: 401,
    description: '未認証（トークンが無効または期限切れ）',
    type: UnauthorizedResponseDto,
  })
  async findAll(@Request() req: RequestWithUser): Promise<object[]> {
    return this.membershipService.getUserChannels(req.user.id);
  }

  /**
   * 参加可能なチャンネル一覧を取得する（パブリックかつ未参加）
   * @param {RequestWithUser} req - 認証済みリクエスト
   * @returns {Promise<object[]>} 参加可能チャンネル一覧
   */
  @Get('browse')
  @ApiOperation({
    summary: '参加可能チャンネル一覧取得',
    description: 'ユーザーがまだ参加していないパブリックチャンネル一覧を取得します。',
  })
  @ApiResponse({
    status: 200,
    description: '取得成功。参加可能チャンネル一覧を返却。',
  })
  @ApiResponse({
    status: 401,
    description: '未認証（トークンが無効または期限切れ）',
    type: UnauthorizedResponseDto,
  })
  async browse(@Request() req: RequestWithUser): Promise<object[]> {
    return this.membershipService.getDiscoverableChannels(req.user.id);
  }

  /**
   * 指定 ID のチャットルームを取得する
   * @param {number} id - チャットルーム ID
   * @returns {Promise<object>} チャットルーム情報
   * @throws {NotFoundException} ルームが存在しない場合
   */
  @Get(':id')
  @ApiOperation({
    summary: 'チャットルーム取得',
    description: '指定 ID のチャットルームを取得します。',
  })
  @ApiResponse({
    status: 200,
    description: '取得成功。チャットルーム情報を返却。',
  })
  @ApiResponse({
    status: 401,
    description: '未認証（トークンが無効または期限切れ）',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'チャットルームが見つからない',
    type: NotFoundResponseDto,
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<object> {
    const room = await this.chatRoomsService.findById(id);
    if (!room) {
      throw new NotFoundException(`チャットルームが見つかりません（ID: ${id}）`);
    }
    return room;
  }

  /**
   * チャンネルのメンバー一覧を取得する
   * @param {RequestWithUser} req - 認証済みリクエスト
   * @param {number} id - チャンネル ID
   * @returns {Promise<object[]>} メンバー一覧
   */
  @Get(':id/members')
  @ApiOperation({
    summary: 'チャンネルメンバー一覧取得',
    description: '指定チャンネルのメンバー一覧を取得します。',
  })
  @ApiResponse({
    status: 200,
    description: '取得成功。メンバー一覧を返却。',
  })
  @ApiResponse({
    status: 401,
    description: '未認証',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'アクセス権限がない',
    type: ForbiddenResponseDto,
  })
  async getMembers(
    @Request() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<object[]> {
    // メンバーシップ確認
    const canAccess = await this.membershipService.canAccessChannel(req.user.id, id);
    if (!canAccess) {
      throw new NotFoundException('チャンネルが見つからないか、アクセス権限がありません');
    }
    return this.membershipService.getChannelMembers(id);
  }

  /**
   * パブリックチャンネルに参加する
   * @param {RequestWithUser} req - 認証済みリクエスト
   * @param {number} id - チャンネル ID
   * @returns {Promise<object>} 作成されたメンバーシップ
   */
  @Post(':id/join')
  @ApiOperation({
    summary: 'チャンネル参加',
    description: 'パブリックチャンネルに参加します。',
  })
  @ApiResponse({
    status: 201,
    description: '参加成功。メンバーシップ情報を返却。',
  })
  @ApiResponse({
    status: 400,
    description: '既にメンバーの場合',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '未認証',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'プライベートチャンネルへの直接参加',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'チャンネルが見つからない',
    type: NotFoundResponseDto,
  })
  async join(
    @Request() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<object> {
    return this.membershipService.joinPublicChannel(req.user.id, id);
  }

  /**
   * チャンネルから退出する
   * @param {RequestWithUser} req - 認証済みリクエスト
   * @param {number} id - チャンネル ID
   * @returns {Promise<object>} 成功メッセージ
   */
  @Post(':id/leave')
  @ApiOperation({
    summary: 'チャンネル退出',
    description: 'チャンネルから退出します。オーナーは退出できません。',
  })
  @ApiResponse({
    status: 200,
    description: '退出成功。',
  })
  @ApiResponse({
    status: 401,
    description: '未認証',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'オーナーは退出不可',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'メンバーシップが見つからない',
    type: NotFoundResponseDto,
  })
  async leave(
    @Request() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<object> {
    await this.membershipService.leaveChannel(req.user.id, id);
    return { message: 'チャンネルから退出しました' };
  }

  /**
   * メンバーをチャンネルに招待する
   * @param {RequestWithUser} req - 認証済みリクエスト
   * @param {number} id - チャンネル ID
   * @param {InviteMembersDto} inviteMembersDto - 招待するユーザー ID の配列
   * @returns {Promise<object>} 招待結果
   */
  @Post(':id/invite')
  @ApiOperation({
    summary: 'メンバー招待',
    description: 'メンバーをチャンネルに招待します。オーナーまたは管理者のみ。',
  })
  @ApiResponse({
    status: 201,
    description: '招待成功。招待されたメンバー一覧を返却。',
  })
  @ApiResponse({
    status: 400,
    description: 'バリデーションエラー',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '未認証',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: '招待権限がない',
    type: ForbiddenResponseDto,
  })
  async invite(
    @Request() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() inviteMembersDto: InviteMembersDto,
  ): Promise<object> {
    const members = await this.membershipService.inviteMembers(
      req.user.id,
      id,
      inviteMembersDto.userIds,
    );
    return {
      message: `${members.length}人のメンバーを招待しました`,
      invitedCount: members.length,
    };
  }

  /**
   * メンバーをチャンネルからキックする
   * @param {RequestWithUser} req - 認証済みリクエスト
   * @param {number} id - チャンネル ID
   * @param {number} userId - キック対象のユーザー ID
   * @returns {Promise<object>} 成功メッセージ
   */
  @Delete(':id/members/:userId')
  @ApiOperation({
    summary: 'メンバーキック',
    description: 'メンバーをチャンネルからキックします。オーナーまたは管理者のみ。',
  })
  @ApiResponse({
    status: 200,
    description: 'キック成功。',
  })
  @ApiResponse({
    status: 401,
    description: '未認証',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'キック権限がない',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '対象ユーザーがメンバーでない',
    type: NotFoundResponseDto,
  })
  async kickMember(
    @Request() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<object> {
    await this.membershipService.kickMember(req.user.id, id, userId);
    return { message: 'メンバーをキックしました' };
  }

  /**
   * チャンネルのスター状態を切り替える
   * @param {RequestWithUser} req - 認証済みリクエスト
   * @param {number} id - チャンネル ID
   * @returns {Promise<object>} 新しいスター状態
   */
  @Post(':id/star')
  @ApiOperation({
    summary: 'スター切替',
    description: 'チャンネルのスター（お気に入り）状態を切り替えます。',
  })
  @ApiResponse({
    status: 200,
    description: '切替成功。新しいスター状態を返却。',
  })
  @ApiResponse({
    status: 401,
    description: '未認証',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'メンバーシップが見つからない',
    type: NotFoundResponseDto,
  })
  async toggleStar(
    @Request() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<object> {
    return this.membershipService.toggleStar(req.user.id, id);
  }
}
