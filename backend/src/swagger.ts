/**
 * @fileoverview Swagger 設定モジュール
 * @description OpenAPI ドキュメントの設定とセットアップを担当
 */

import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';

/**
 * Swagger ドキュメントの設定オプション
 */
interface SwaggerConfig {
  title: string;
  description: string;
  version: string;
  path: string;
}

/**
 * デフォルトの Swagger 設定
 */
const DEFAULT_CONFIG: SwaggerConfig = {
  title: 'Chat App API',
  description: 'NestJS + Prisma で構築されたチャットアプリケーション API',
  version: '1.0',
  path: 'api/docs',
};

/**
 * Swagger ドキュメントビルダーを作成する
 * @param config - Swagger 設定オプション
 * @returns OpenAPI ドキュメント設定
 */
function createDocumentConfig(config: SwaggerConfig): Omit<OpenAPIObject, 'paths'> {
  return new DocumentBuilder()
    .setTitle(config.title)
    .setDescription(config.description)
    .setVersion(config.version)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'JWT アクセストークンを入力してください',
        in: 'header',
      },
      'access-token',
    )
    .addTag('auth', '認証関連 API（サインアップ・ログイン）')
    .addTag('users', 'ユーザー管理 API')
    .addTag('chat', 'チャット関連 API')
    .addTag('health', 'ヘルスチェック API')
    .build();
}

/**
 * 本番環境かどうかを判定する
 * @returns {boolean} 本番環境の場合 true
 */
function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * NestJS アプリケーションに Swagger を設定する
 * @description 本番環境以外でのみ Swagger UI を有効化する
 * @param {INestApplication} app - NestJS アプリケーションインスタンス
 * @param {Partial<SwaggerConfig>} customConfig - カスタム設定（オプション）
 * @returns {void}
 */
export function setupSwagger(app: INestApplication, customConfig?: Partial<SwaggerConfig>): void {
  // 本番環境では Swagger を無効化
  if (isProduction()) {
    // eslint-disable-next-line no-console
    console.log('Swagger is disabled in production environment');
    return;
  }

  const config: SwaggerConfig = {
    ...DEFAULT_CONFIG,
    ...customConfig,
  };

  const documentConfig = createDocumentConfig(config);
  const document = SwaggerModule.createDocument(app, documentConfig);

  SwaggerModule.setup(config.path, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
    },
  });

  // eslint-disable-next-line no-console
  console.log(
    `Swagger UI is available at: http://localhost:${process.env.PORT || 3000}/${config.path}`,
  );
}
