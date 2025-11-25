# ヘルスチェック API 仕様書

## 1. エンドポイント概要

### 1.1 提供エンドポイント

| Method | URL | 認証 | 説明 |
|--------|-----|------|------|
| GET | `/health` | 不要 | アプリケーションおよび依存コンポーネントの稼働状況を確認 |

### 1.2 用途

- **インフラ監視**: ロードバランサー（ALB/NLB等）からのヘルスチェック
- **モニタリング**: Datadog, Prometheus, CloudWatch 等のモニタリングツールからの監視
- **アラート**: 異常検知時のアラート発報トリガー
- **デプロイ**: Blue/Green デプロイ時の切り替え判定

---

## 2. チェック内容

### 2.1 現在のチェック項目

| チェック項目 | 説明 | 実装方法 |
|-------------|------|---------|
| `app` | アプリケーションプロセスの稼働確認 | エンドポイントにレスポンスできること自体で確認 |
| `db` | MySQL データベースへの接続確認 | Prisma 経由で `SELECT 1` 相当のクエリを実行 |

### 2.2 DB チェックの詳細

```typescript
// Prisma を用いた疎通確認
await this.prisma.$queryRaw`SELECT 1`;
```

- クエリが成功すれば `"up"`
- 例外発生時は `"down"`

### 2.3 将来の拡張候補

以下のチェック項目は、システム拡張時に追加を検討:

| チェック項目 | 説明 |
|-------------|------|
| `redis` | Redis キャッシュサーバーへの接続確認 |
| `external_api` | 外部 API（認証プロバイダ等）への疎通確認 |
| `queue` | メッセージキュー（RabbitMQ, SQS 等）の接続確認 |
| `storage` | ファイルストレージ（S3 等）へのアクセス確認 |

---

## 3. レスポンス仕様

### 3.1 正常時レスポンス

**HTTP Status**: `200 OK`

```json
{
  "status": "ok",
  "timestamp": "2025-11-25T12:34:56.789Z",
  "checks": {
    "app": "up",
    "db": "up"
  }
}
```

### 3.2 異常時レスポンス（DB 接続失敗）

**HTTP Status**: `503 Service Unavailable`

```json
{
  "status": "error",
  "timestamp": "2025-11-25T12:34:56.789Z",
  "checks": {
    "app": "up",
    "db": "down"
  }
}
```

### 3.3 レスポンスフィールド定義

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `status` | `"ok"` \| `"error"` | 全体ステータス。全チェック正常なら `"ok"`、いずれか異常なら `"error"` |
| `timestamp` | string (ISO 8601) | サーバー側での現在時刻 |
| `checks` | object | 個別コンポーネントの状態 |
| `checks.app` | `"up"` \| `"down"` | アプリケーションプロセスの状態 |
| `checks.db` | `"up"` \| `"down"` | データベース接続の状態 |

---

## 4. ステータスコードポリシー

### 4.1 正常系

| 条件 | HTTP Status |
|------|-------------|
| 全チェック項目が正常 | `200 OK` |

### 4.2 異常系

| 条件 | HTTP Status |
|------|-------------|
| DB 接続に失敗 | `503 Service Unavailable` |
| その他重要コンポーネントに障害 | `503 Service Unavailable` |

### 4.3 部分障害時の方針

- **クリティカルコンポーネント**（DB 等）に障害がある場合:
  - `503 Service Unavailable` を返却
  - ロードバランサーはこのインスタンスをヘルシーでないと判断し、トラフィックを振り分けない

- **非クリティカルコンポーネント**（将来追加予定のキャッシュ等）に障害がある場合:
  - `200 OK` を返却しつつ、該当コンポーネントを `"down"` として報告
  - アラートは発報するが、インスタンスは稼働継続

---

## 5. 利用例

### 5.1 curl での確認

```bash
# 正常時
curl -i http://localhost:3000/health
# HTTP/1.1 200 OK
# {"status":"ok","timestamp":"2025-11-25T12:34:56.789Z","checks":{"app":"up","db":"up"}}

# DB 障害時
curl -i http://localhost:3000/health
# HTTP/1.1 503 Service Unavailable
# {"status":"error","timestamp":"2025-11-25T12:34:56.789Z","checks":{"app":"up","db":"down"}}
```

### 5.2 Docker Compose でのヘルスチェック設定例

```yaml
services:
  backend:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### 5.3 AWS ALB ターゲットグループ設定例

| 設定項目 | 値 |
|---------|-----|
| ヘルスチェックパス | `/health` |
| プロトコル | HTTP |
| 正常しきい値 | 2 |
| 異常しきい値 | 3 |
| タイムアウト | 5秒 |
| 間隔 | 30秒 |
| 成功コード | 200 |
