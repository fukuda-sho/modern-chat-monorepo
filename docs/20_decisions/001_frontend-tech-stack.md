# ADR-001: フロントエンド技術スタック選定

## ステータス

Accepted

## 日付

2025-11-26

## コンテキスト

リアルタイムチャットアプリケーションのフロントエンドを新規構築するにあたり、以下の要件を満たす技術スタックを選定する必要がある。

### 要件

- リアルタイム通信（WebSocket）のサポート
- 型安全性の担保
- モダンな UI/UX（ダークモード対応含む）
- 将来的な機能拡張への耐性
- チーム開発における保守性

### 制約

- React / Next.js (App Router) / Tailwind CSS は確定
- パッケージマネージャーは Yarn
- バックエンドは NestJS + Socket.IO で実装済み

---

## 決定

### UI コンポーネント: shadcn/ui

**選定理由:**

1. Tailwind CSS とネイティブ統合
2. コードコピー方式により完全なカスタマイズが可能
3. Radix UI ベースでアクセシビリティ担保
4. 使用コンポーネントのみバンドルされる

**検討した代替案:**

| 候補 | 不採用理由 |
|------|-----------|
| Headless UI | コンポーネント種類が限定的 |
| Chakra UI | 独自スタイルシステムが Tailwind と競合 |
| MUI | Material Design に縛られる |

---

### 状態管理: Zustand + TanStack Query

**選定理由:**

1. **Zustand (クライアント状態)**
   - 軽量（~2KB）でボイラープレートが少ない
   - React 外からアクセス可能（WebSocket コールバック向け）
   - TypeScript との親和性が高い

2. **TanStack Query (サーバー状態)**
   - キャッシュ管理・再検証が自動化
   - 楽観的更新のサポート
   - WebSocket との併用パターンが確立されている

**検討した代替案:**

| 候補 | 不採用理由 |
|------|-----------|
| Redux Toolkit | このプロジェクト規模ではオーバーエンジニアリング |
| Jotai | アトミック設計がチャットの複雑な状態に不向き |
| Recoil | 開発活動が停滞気味 |

---

### フォーム: react-hook-form + Zod

**選定理由:**

1. 非制御コンポーネントによる高パフォーマンス
2. Zod との統合で型安全なバリデーション
3. バックエンドとスキーマ定義を共有可能

---

### テスト: Vitest + React Testing Library + Playwright

**選定理由:**

1. **Vitest**: Jest 互換で高速、ESM ネイティブサポート
2. **React Testing Library**: ユーザー視点のテスト記述
3. **Playwright**: クロスブラウザ E2E テスト

---

## 影響

### ポジティブ

- 型安全性が向上し、ランタイムエラーが減少
- 軽量なバンドルサイズ
- 学習コストが比較的低い
- コミュニティサポートが活発

### ネガティブ

- shadcn/ui はコードコピー方式のため、アップデート追従が手動
- 複数ライブラリの組み合わせにより、設定の複雑さが増す

### リスク

- Zustand のメジャーアップデート時の移行コスト
- TanStack Query と WebSocket の連携パターンの習熟が必要

---

## 関連ドキュメント

- [00_tech-stack-architecture.md](../10_implementation/frontend/00_tech-stack-architecture.md)
