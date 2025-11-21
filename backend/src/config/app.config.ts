/**
 * アプリケーション設定
 *
 * 環境変数を読み込み、型付けされたオブジェクトとして返却します。
 * すべての環境変数の変換とデフォルト値の定義をここで行います。
 */
export default () => ({
  /**
   * サーバーポート番号
   * デフォルト: 3000
   */
  port: parseInt(process.env.PORT || '3000', 10),

  /**
   * Node.js実行環境
   * デフォルト: 'development'
   */
  nodeEnv: process.env.NODE_ENV || 'development',

  /**
   * CORS設定
   */
  cors: {
    /**
     * 許可するオリジンのリスト
     *
     * CORS_ALLOWED_ORIGINSをカンマ区切りで指定
     * 例: "http://localhost:3000,http://localhost:3001"
     *
     * 設定がない場合は空配列（すべて拒否）
     */
    origins: process.env.CORS_ALLOWED_ORIGINS
      ? process.env.CORS_ALLOWED_ORIGINS.split(',').map((origin) =>
          origin.trim(),
        )
      : [],
  },

  /**
   * データベース設定
   */
  database: {
    /**
     * データベース接続URL
     * Prismaで使用されます
     */
    url: process.env.DATABASE_URL,
  },

  /**
   * JWT設定
   */
  jwt: {
    /**
     * JWTトークンの署名に使用するシークレットキー
     * 本番環境では必ず安全な値に変更してください
     */
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',

    /**
     * JWTトークンの有効期限
     * デフォルト: 24時間
     */
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  /**
   * フロントエンドURL
   * WebSocket CORSなどで使用されます
   */
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
});
