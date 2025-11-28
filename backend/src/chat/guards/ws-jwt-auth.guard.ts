/**
 * @fileoverview WebSocket JWT 認証ガード
 * @description WebSocket 接続時の JWT 検証を行うガード
 */

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { WsUser } from '../types/chat.types';

/**
 * JWT ペイロードの型定義
 */
interface JwtPayload {
  /** ユーザー ID（subject） */
  sub: number;
  /** メールアドレス */
  email: string;
}

/**
 * WebSocket JWT 認証ガードクラス
 * @description ハンドシェイク時に JWT を検証し、認証済みユーザー情報を socket.data に格納
 */
@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  /**
   * WsJwtAuthGuard のコンストラクタ
   * @param {JwtService} jwtService - JWT サービスインスタンス
   */
  constructor(private jwtService: JwtService) {}

  /**
   * 認証を実行する
   * @param {ExecutionContext} context - 実行コンテキスト
   * @returns {boolean} 認証成功時は true
   * @throws {WsException} 認証失敗時
   */
  canActivate(context: ExecutionContext): boolean {
    const client: Socket = context.switchToWs().getClient<Socket>();
    const token = this.extractToken(client);

    if (!token) {
      throw new WsException('Unauthorized: No token provided');
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      const user: WsUser = {
        userId: payload.sub,
        email: payload.email,
      };

      // socket.data.user にユーザー情報を格納
      client.data.user = user;

      return true;
    } catch {
      throw new WsException('Unauthorized: Invalid token');
    }
  }

  /**
   * ソケットから JWT トークンを抽出する
   * @param {Socket} client - Socket.IO クライアント
   * @returns {string | null} 抽出されたトークン、または null
   */
  private extractToken(client: Socket): string | null {
    // 1. auth フィールドから取得（推奨）
    const authToken = client.handshake.auth?.token as string | undefined;
    if (authToken) {
      return this.parseBearer(authToken);
    }

    // 2. Authorization ヘッダから取得
    const authHeader = client.handshake.headers?.authorization;
    if (authHeader) {
      return this.parseBearer(authHeader);
    }

    // 3. クエリパラメータから取得（フォールバック）
    const queryToken = client.handshake.query?.token;
    if (typeof queryToken === 'string') {
      return queryToken;
    }

    return null;
  }

  /**
   * Bearer トークン形式からトークン部分を抽出する
   * @param {string} value - Bearer トークン文字列
   * @returns {string | null} トークン部分、または null
   */
  private parseBearer(value: string): string | null {
    if (value.startsWith('Bearer ')) {
      return value.substring(7);
    }
    return value;
  }
}
