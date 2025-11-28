/**
 * @fileoverview 認証サービス
 * @description ユーザー登録・ログイン・JWT 発行のビジネスロジックを提供
 */

import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

/**
 * パスワードを除外したユーザー情報の型定義
 */
interface UserWithoutPassword {
  id: number;
  username: string;
  email: string;
  createdAt: Date;
}

/**
 * ログインレスポンスの型定義
 */
interface LoginResponse {
  accessToken: string;
}

/**
 * 認証サービスクラス
 * @description signup, login のビジネスロジックを実装
 */
@Injectable()
export class AuthService {
  /**
   * AuthService のコンストラクタ
   * @param {PrismaService} prisma - Prisma サービスインスタンス
   * @param {JwtService} jwtService - JWT サービスインスタンス
   */
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * 新規ユーザーを登録する
   * @param {SignupDto} signupDto - サインアップ用 DTO
   * @returns {Promise<UserWithoutPassword>} パスワードを除外したユーザー情報
   * @throws {ConflictException} メールアドレスまたはユーザー名が既に存在する場合
   */
  async signup(signupDto: SignupDto): Promise<UserWithoutPassword> {
    const { email, password, username } = signupDto;

    // メールアドレスの重複チェック
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // ユーザー名の重複チェック
    const existingUsername = await this.prisma.user.findUnique({
      where: { username },
    });

    if (existingUsername) {
      throw new ConflictException('Username already exists');
    }

    // パスワードをハッシュ化
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // ユーザーを作成
    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
      },
    });

    // パスワードを除外して返却
    const { password: _, ...result } = user;
    return result;
  }

  /**
   * ユーザーをログインさせ、JWT トークンを発行する
   * @param {LoginDto} loginDto - ログイン用 DTO
   * @returns {Promise<LoginResponse>} アクセストークンを含むオブジェクト
   * @throws {UnauthorizedException} メールアドレスが存在しない、またはパスワードが一致しない場合
   */
  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const { email, password } = loginDto;

    // メールアドレスでユーザーを検索
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // パスワードを検証
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // JWT を発行
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }
}
