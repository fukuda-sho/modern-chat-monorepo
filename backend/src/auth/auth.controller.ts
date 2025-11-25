/**
 * @fileoverview 認証コントローラー
 * @description /auth エンドポイントのルーティングを定義
 */

import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import {
  ApiErrorResponseDto,
  UnauthorizedResponseDto,
  ConflictResponseDto,
} from '../common/dto';

/**
 * 認証コントローラークラス
 * @description サインアップ・ログインエンドポイントを提供
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  /**
   * AuthController のコンストラクタ
   * @param {AuthService} authService - 認証サービスインスタンス
   */
  constructor(private authService: AuthService) {}

  /**
   * 新規ユーザーを登録する
   * @param {SignupDto} signupDto - サインアップ用 DTO
   * @returns {Promise<object>} パスワードを除外したユーザー情報
   */
  @Post('signup')
  @ApiOperation({
    summary: 'ユーザー登録',
    description: '新規ユーザーを作成します。メールアドレスとユーザー名は一意である必要があります。',
  })
  @ApiResponse({
    status: 201,
    description: '登録成功。パスワードを除外したユーザー情報を返却。',
  })
  @ApiResponse({
    status: 400,
    description: 'バリデーションエラー（入力形式が不正）',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'メールアドレスまたはユーザー名の重複',
    type: ConflictResponseDto,
  })
  async signup(@Body() signupDto: SignupDto): Promise<object> {
    return this.authService.signup(signupDto);
  }

  /**
   * ユーザーをログインさせる
   * @param {LoginDto} loginDto - ログイン用 DTO
   * @returns {Promise<object>} アクセストークンを含むオブジェクト
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'ログイン',
    description: 'メールアドレスとパスワードで認証し、JWT アクセストークンを取得します。',
  })
  @ApiResponse({
    status: 200,
    description: 'ログイン成功。JWT アクセストークンを返却。',
  })
  @ApiResponse({
    status: 401,
    description: '認証失敗（メールアドレスまたはパスワードが無効）',
    type: UnauthorizedResponseDto,
  })
  async login(@Body() loginDto: LoginDto): Promise<object> {
    return this.authService.login(loginDto);
  }
}
