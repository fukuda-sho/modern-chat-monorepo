# プロンプトログ: フロントエンド技術選定・設計

## 日付

2025-11-26

## プロンプト概要

リアルタイムチャットアプリケーションのフロントエンド技術選定と設計を依頼。

### 前提条件

- アプリ種別: リアルタイムチャットアプリケーション
- バックエンド: 実装済み（NestJS + Prisma + MySQL + Socket.IO）
- 確定技術スタック:
  - React (最新安定版)
  - Next.js (App Router)
  - Tailwind CSS
  - Yarn

### 要求事項

1. 全体アーキテクチャ設計
2. 技術選定（ライブラリ・ツール）
3. リアルタイムチャット特有の設計
4. ディレクトリ構成とレイヤードアーキテクチャ
5. 品質・開発体験
6. MVP の定義

---

## 回答計画

### 採用技術スタック

| カテゴリ | 採用技術 | 理由 |
|---------|---------|------|
| フレームワーク | Next.js 15 (App Router) | 確定 |
| 言語 | TypeScript (strict) | 型安全性 |
| スタイリング | Tailwind CSS v4 | 確定 |
| UI コンポーネント | shadcn/ui | Tailwind ネイティブ、カスタマイズ性高 |
| 状態管理 | Zustand | 軽量、WebSocket 連携向き |
| サーバー状態 | TanStack Query v5 | キャッシュ・再検証 |
| WebSocket | socket.io-client | バックエンド互換 |
| フォーム | react-hook-form + Zod | 型安全バリデーション |
| テスト | Vitest + RTL + Playwright | 高速・E2E カバレッジ |

### 作成したドキュメント

1. `docs/10_implementation/frontend/00_tech-stack-architecture.md`
   - 技術スタック詳細
   - アーキテクチャ設計
   - 品質・開発体験

2. `docs/10_implementation/frontend/01_directory-structure.md`
   - ディレクトリ構成
   - 命名規則
   - Feature-Sliced Design

3. `docs/10_implementation/frontend/02_auth-pages.md`
   - ログイン画面仕様
   - サインアップ画面仕様
   - バリデーションスキーマ

4. `docs/10_implementation/frontend/03_chat-room-ui.md`
   - チャットルーム画面仕様
   - コンポーネント設計
   - Zustand ストア設計

5. `docs/10_implementation/frontend/04_websocket-integration.md`
   - WebSocket 統合設計
   - SocketService 実装
   - イベントフロー

6. `docs/20_decisions/001_frontend-tech-stack.md`
   - ADR: 技術選定の決定記録

---

## MVP 定義

### Phase 1: 認証 + 単一ルームチャット

| 画面 | 機能 |
|------|------|
| ログイン | メール/パスワード認証、JWT 保存 |
| サインアップ | ユーザー登録 |
| チャットルーム | メッセージ表示・送信・リアルタイム受信 |

### 必要コンポーネント

- `LoginForm` / `SignupForm`
- `ChatRoom` / `MessageList` / `MessageItem` / `MessageInput`
- `RoomList` / `RoomItem`

### 必要な API 連携

- REST: `POST /auth/login`, `POST /auth/signup`, `GET /users/me`
- WebSocket: `joinRoom`, `sendMessage`, `messageCreated`

---

## 次のステップ

1. ドキュメント承認後、`frontend/` ディレクトリの初期セットアップ
2. Next.js プロジェクト作成
3. Tailwind CSS + shadcn/ui 設定
4. 認証機能実装
5. チャット機能実装
