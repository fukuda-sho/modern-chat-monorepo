# フロントエンド構成の最適化 (Runtime Config & Docker Best Practice)

## 目的

- Dockerイメージを1度だけビルドし、任意の環境で `API_URL` を差し替えるだけで再利用できるようにする。
- Next.js Standalone モードとAlpineベースの最小ランタイムを組み合わせ、100MB前後の軽量イメージを維持する。
- 非rootユーザー実行とランタイム環境変数により、セキュリティと可搬性を両立する。

## Runtime Configuration 戦略

1. **Server Componentで環境変数を確定**
   - `app/layout.tsx` (Server Component) が `process.env.API_URL` を参照し、値を `EnvProvider` に渡す。
   - `NEXT_PUBLIC_` プレフィックスは完全に廃止し、`API_URL` をランタイムで注入する。
2. **EnvProviderによるContext配信**
   - `EnvProvider` は Client Component であり、`apiUrl` と `socketUrl`、および `axios` クライアントを Context として提供する。
   - `useEnv()` フックでどこからでもランタイム設定にアクセス可能。
3. **クライアント機能は Context を参照**
   - `useSocket`、`LoginForm`、`SignupPage` などの Client Component/Hook は `useEnv()` から URL を取得する。
   - `frontend/.env` (または `.env.local`) では `API_URL=<環境のAPIエンドポイント>` を設定する。既存の `NEXT_PUBLIC_API_URL` エントリは削除する。
4. **型定義**
   - `src/types/env.d.ts` で `process.env.API_URL` を型定義し、`RuntimeEnvConfig` を `src/types/env.ts` で共有する。

### 運用例

```bash
# 本番APIに接続する例
API_URL=https://api.example.com docker run --rm -p 3001:3000 chat-frontend:latest

# ステージングAPIに接続する例
API_URL=https://stg-api.example.com docker run --rm -p 3001:3000 chat-frontend:latest
```

## Docker最適化戦略

1. **ベースイメージ**
   - `node:18-alpine` を `base` ステージとして共有。`corepack` 不要・Yarnは `yarn install --frozen-lockfile` で利用。
2. **Multi-stage構成**
   - `deps` ステージで依存関係をインストールし、`builder` ステージに転送して `yarn build` を実行。
   - ランタイム (`runner`) では `.next/standalone` と `.next/static`、`public` のみをコピー。
3. **非rootユーザー**
   - `nextjs` (uid=1001) を作成し、`nodejs` グループに所属させた上で `USER nextjs` で実行。
4. **ランタイム環境変数のみで接続先を切り替え**
   - Build 時に API URL を埋め込まない。`docker run -e API_URL=...` で差し替え。
5. **最小限のCOPY**
   - Standalone モードで生成された `server.js` と必要な Node 依存のみをコピーし、不要な dev 依存やソースを含めない。

## Docker Compose 指針

```yaml
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile
  environment:
    API_URL: http://backend:3000
  ports:
    - "3001:3000"
```

- `API_URL` のみを環境によって変更し、同一イメージを使い回す。
- Backend サービス名をそのままURLに使用することで、コンテナ間通信でもDNS解決可能。

## 成果

- **イメージ再利用性**: `Build Once, Run Anywhere` を実現。
- **セキュリティ**: 非root実行により侵害時の被害を抑制。
- **可観測性**: すべてのクライアント機能が `useEnv()` を経由するため、デバッグ時に設定値を一箇所で確認できる。
