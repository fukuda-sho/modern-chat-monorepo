/**
 * @fileoverview ユーザーコントローラー
 * @description /users エンドポイントのルーティングを定義
 */

import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

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
  async getMe(@Request() req: RequestWithUser): Promise<object> {
    return this.usersService.findById(req.user.id);
  }
}
