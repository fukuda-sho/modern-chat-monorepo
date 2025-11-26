import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Docker デプロイ用のスタンドアロン出力設定
   * .next/standalone ディレクトリに自己完結型のビルド成果物を生成
   */
  output: "standalone",
};

export default nextConfig;
