/**
 * @fileoverview 認証コントローラー
 * @description /auth エンドポイントのルーティングを定義
 */

import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

/**
 * 認証コントローラークラス
 * @description サインアップ・ログインエンドポイントを提供
 */
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
  async login(@Body() loginDto: LoginDto): Promise<object> {
    return this.authService.login(loginDto);
  }
}
