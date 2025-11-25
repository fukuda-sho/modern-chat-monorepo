/**
 * @fileoverview ユーザーコントローラー
 * @description /users エンドポイントのルーティングを定義
 */

import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { UnauthorizedResponseDto } from '../common/dto';

/**
 * 認証済みリクエストの型定義
 * @description request.user を含むリクエストオブジェクト
 */
interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}

/**
 * ユーザーコントローラークラス
 * @description ユーザー情報取得エンドポイントを提供
 */
@ApiTags('users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  /**
   * UsersController のコンストラクタ
   * @param {UsersService} usersService - ユーザーサービスインスタンス
   */
  constructor(private usersService: UsersService) {}

  /**
   * ログイン中のユーザー情報を取得する
   * @param {RequestWithUser} req - 認証済みリクエスト
   * @returns {Promise<object>} パスワードを除外したユーザー情報
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: '自身のユーザー情報取得',
    description: 'JWT トークンで認証されたユーザー自身の情報を取得します。',
  })
  @ApiResponse({
    status: 200,
    description: '取得成功。パスワードを除外したユーザー情報を返却。',
  })
  @ApiResponse({
    status: 401,
    description: '未認証（トークンが無効または期限切れ）',
    type: UnauthorizedResponseDto,
  })
  async getMe(@Request() req: RequestWithUser): Promise<object> {
    return this.usersService.findById(req.user.id);
  }
}
