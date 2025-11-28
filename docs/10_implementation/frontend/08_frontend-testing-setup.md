# 08. フロントエンド単体テスト環境導入設計書（Next.js / React / Vitest）

## 0. ファイル情報

- パス: `docs/10_implementation/frontend/08_frontend-testing-setup.md`
- 対象: フロントエンドアプリケーション（`frontend/` ディレクトリ配下）
- 目的:
  - 現状存在しない「ソースコードレベルの単体テスト環境」を導入し、
    コンポーネント / hooks / ユーティリティのテストを、最新のベストプラクティスに沿った技術スタックで実現する。

---

## 1. 目的・スコープ

### 1.1 目的

- フロントエンドの品質向上とリファクタリング耐性を高めるため、**単体テスト環境（ユニットテスト）**を構築する。
- 開発者が次のような対象をテストできるようにする：
  - UI コンポーネント（shadcn/ui + Tailwind ベース）
  - カスタムフック（状態管理 / WebSocket / TanStack Query ラッパーなど）
  - 純粋なユーティリティ関数（フォーマッタ、バリデーションなど）

### 1.2 スコープ

- **含まれるもの**
  - テストランナー・アサーションライブラリの選定と導入（Vitest）
  - React コンポーネント向けテスティングツールの導入（React Testing Library）
  - DOM エミュレーション環境（`jsdom`）の設定
  - TypeScript / path alias / Next.js 特有モジュール（`next/router` など）のモック方針
  - yarn スクリプト・ディレクトリ構成・サンプルテストの作成

- **含まれないもの**
  - E2E テスト（Playwright 等）は別指示書で扱う（ここでは単体テストにフォーカス）
  - バックエンド（NestJS）のテスト環境構築

---

## 2. 採用するテスト技術スタック

### 2.1 テストランナー / アサーション

- **Vitest**
  - 選定理由:
    - Vite 互換、React/TS プロジェクトとの親和性が高い
    - `jest` ライクな API（`describe`, `it`, `expect`）で学習コストが低い
    - 高速なウォッチ / 並列実行
  - 代替案:
    - Jest: 実績は多いが、Next.js + 最新スタックでは Vitest の方が構成がシンプルでビルドも速い
    - Node の built-in test runner: まだエコシステムが細い

### 2.2 React コンポーネントテスト

- **@testing-library/react（React Testing Library）**
  - 選定理由:
    - 「ユーザー視点の振る舞いをテストする」理念に沿った API（`getByRole` など）
    - shadcn/ui や Tailwind にも問題なく対応
  - 代替案:
    - Enzyme: 既にメンテナンス縮小・非推奨に近く、採用しない

### 2.3 DOM 環境

- **jsdom**
  - Node.js 上で DOM API をエミュレーションし、ブラウザなしでコンポーネントテストを実行する。

### 2.4 モックサーバ / API モック（将来的な拡張）

- 本書のスコープ外だが、将来的に次を導入する余地を残す：
  - **MSW (Mock Service Worker)**：HTTP / WebSocket のモックに有効

---

## 3. ディレクトリ構成と命名規則

### 3.1 テストファイルの配置方針

- **ソースコードと同階層に `*.test.tsx` / `*.test.ts` を配置**する。

例：

```txt
frontend/
  components/
    chat/
      chat-room.tsx
      chat-room.test.tsx
    layout/
      sidebar.tsx
      sidebar.test.tsx
  features/
    chat/
      components/
        message-input.tsx
        message-input.test.tsx
      hooks/
        use-chat-socket.ts
        use-chat-socket.test.ts
  lib/
    utils.ts
    utils.test.ts
```

### 3.2 命名規則

* テスト対象ファイル名 + `.test.ts(x)`：

  * `message-input.tsx` → `message-input.test.tsx`
  * `utils.ts` → `utils.test.ts`

---

## 4. 導入手順（パッケージと設定）

### 4.1 依存パッケージの追加

`frontend` ディレクトリで以下を追加する（yarn 利用前提）：

```bash
cd frontend

yarn add -D vitest @vitest/ui @vitest/coverage-v8 \
  @testing-library/react @testing-library/jest-dom @testing-library/dom \
  jsdom \
  @testing-library/user-event \
  @vitejs/plugin-react vite
```

* `@vitest/ui`: 必要に応じて GUI でテスト確認したい場合
* `@vitest/coverage-v8`: カバレッジ取得用
* `@testing-library/user-event`: ユーザー入力（クリック、キー入力など）のシミュレーション用
* `@vitejs/plugin-react`: React コンポーネントのトランスパイル用

### 4.2 `vitest.config.ts` の作成

Next.js 16 / TypeScript / jsdom 前提で設定ファイルを追加する。

```ts
// frontend/vitest.config.ts
import path from "path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next", "coverage"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "./coverage",
      exclude: [
        "node_modules/**",
        ".next/**",
        "coverage/**",
        "**/*.config.{ts,js,mjs}",
        "**/*.d.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
```

### 4.3 セットアップファイル `vitest.setup.ts`

React Testing Library / jest-dom を登録し、テスト環境を初期化する。

```ts
// frontend/vitest.setup.ts
import "@testing-library/jest-dom";

// グローバルなモック（必要に応じて追加）

// window.matchMedia のモック（Tailwind CSS や shadcn/ui で必要な場合）
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ResizeObserver のモック（一部UIコンポーネントで必要な場合）
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
```

### 4.4 TypeScript 設定の更新

`tsconfig.json` に Vitest グローバル型の参照を追加する。

```json
{
  "compilerOptions": {
    "types": ["vitest/globals"],
    // ... 他の設定
  }
}
```

---

## 5. Next.js / App Router 特有のモック方針

Next.js 16 の App Router を使用しているため、ルーティングや `next/navigation` のモック方針を定義しておく。

### 5.1 `next/navigation` のモック

* ルーティングを利用するコンポーネントのテストでは、`useRouter` や `usePathname` 等をモックする。

例：コンポーネント側で `next/navigation` を利用している場合

```ts
// コンポーネント側
import { useRouter } from "next/navigation";

const router = useRouter();
router.push("/chat/general");
```

テスト側でのモック例：

```ts
// chat-room.test.tsx
vi.mock("next/navigation", () => {
  return {
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
    }),
    useSearchParams: () => new URLSearchParams(),
    usePathname: () => "/chat/general",
  };
});
```

---

## 6. サンプルテストの作成

### 6.1 UI コンポーネントの例：メッセージ入力フォーム

対象コンポーネント：`frontend/features/chat/components/message-input.tsx`

```tsx
'use client';

import { useState, useCallback, type KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [content, setContent] = useState('');

  const handleSend = useCallback(() => {
    const trimmed = content.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setContent('');
    }
  }, [content, disabled, onSend]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-background border-t p-4">
      <div className="flex items-end gap-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="メッセージを入力..."
          disabled={disabled}
          className="max-h-[120px] min-h-[44px] resize-none"
          rows={1}
        />
        <Button
          onClick={handleSend}
          disabled={disabled || !content.trim()}
          size="icon"
          className="h-11 w-11 shrink-0"
        >
          <Send className="h-5 w-5" />
          <span className="sr-only">送信</span>
        </Button>
      </div>
      {disabled && (
        <p className="text-muted-foreground mt-2 text-xs">
          接続中... しばらくお待ちください
        </p>
      )}
    </div>
  );
}
```

テスト例：`frontend/features/chat/components/message-input.test.tsx`

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { MessageInput } from "./message-input";

describe("MessageInput", () => {
  it("テキストを入力して送信ボタンをクリックすると onSend が呼ばれ、入力がクリアされる", async () => {
    const user = userEvent.setup();
    const handleSend = vi.fn();

    render(<MessageInput onSend={handleSend} />);

    const textarea = screen.getByPlaceholderText("メッセージを入力...");
    const button = screen.getByRole("button", { name: "送信" });

    await user.type(textarea, "hello world");
    await user.click(button);

    expect(handleSend).toHaveBeenCalledTimes(1);
    expect(handleSend).toHaveBeenCalledWith("hello world");
    expect(textarea).toHaveValue("");
  });

  it("空文字や空白のみの場合は送信されない", async () => {
    const user = userEvent.setup();
    const handleSend = vi.fn();

    render(<MessageInput onSend={handleSend} />);

    const textarea = screen.getByPlaceholderText("メッセージを入力...");
    const button = screen.getByRole("button", { name: "送信" });

    await user.type(textarea, "   ");
    await user.click(button);

    expect(handleSend).not.toHaveBeenCalled();
  });

  it("Enter キー（Shift なし）で送信される", async () => {
    const user = userEvent.setup();
    const handleSend = vi.fn();

    render(<MessageInput onSend={handleSend} />);

    const textarea = screen.getByPlaceholderText("メッセージを入力...");

    await user.type(textarea, "Enter で送信");
    await user.keyboard("{Enter}");

    expect(handleSend).toHaveBeenCalledTimes(1);
    expect(handleSend).toHaveBeenCalledWith("Enter で送信");
  });

  it("Shift+Enter では送信されない（改行用）", async () => {
    const user = userEvent.setup();
    const handleSend = vi.fn();

    render(<MessageInput onSend={handleSend} />);

    const textarea = screen.getByPlaceholderText("メッセージを入力...");

    await user.type(textarea, "改行テスト");
    await user.keyboard("{Shift>}{Enter}{/Shift}");

    expect(handleSend).not.toHaveBeenCalled();
  });

  it("disabled 時はボタンが無効化され、接続中メッセージが表示される", async () => {
    const handleSend = vi.fn();

    render(<MessageInput onSend={handleSend} disabled />);

    const button = screen.getByRole("button", { name: "送信" });
    const textarea = screen.getByPlaceholderText("メッセージを入力...");

    expect(button).toBeDisabled();
    expect(textarea).toBeDisabled();
    expect(
      screen.getByText("接続中... しばらくお待ちください")
    ).toBeInTheDocument();
  });

  it("入力値の前後の空白はトリムされて送信される", async () => {
    const user = userEvent.setup();
    const handleSend = vi.fn();

    render(<MessageInput onSend={handleSend} />);

    const textarea = screen.getByPlaceholderText("メッセージを入力...");
    const button = screen.getByRole("button", { name: "送信" });

    await user.type(textarea, "  トリムされる  ");
    await user.click(button);

    expect(handleSend).toHaveBeenCalledWith("トリムされる");
  });
});
```

---

## 7. `package.json` スクリプトの追加

`frontend/package.json` にテスト用スクリプトを追加する。

```jsonc
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest run --coverage"
  }
}
```

* 通常のローカル実行:

  * `yarn test`
* ファイル監視付き:

  * `yarn test:watch`
* カバレッジ付き一括実行:

  * `yarn test:coverage`

---

## 8. CI への組み込み方針（概要）

※ 詳細は別途 CI/CD 指示書で扱うが、本書では方針のみ示す。

* CI（GitHub Actions / GitLab CI など）に以下のジョブを追加する：

  * `yarn install --immutable`
  * `yarn test`
* 将来的に Gate を設ける場合：

  * main / develop ブランチへのマージ前にテストが全て成功していることを必須条件とする。
  * カバレッジ閾値（例：ステートメント 80% 以上）を設定する場合は `vitest.config.ts` 側で制御。

---

## 9. Docs as Code 運用・実装状況

### 9.1 Docs as Code 運用

* 本ドキュメントは、フロントエンドの単体テスト環境導入における **設計・方針** を示す。
* 実際の `vitest.config.ts` / `vitest.setup.ts` / サンプルテストの追加等は、本書を参照しながら実装する。

### 9.2 実装タスク完了状況

| タスク | 状況 |
|--------|------|
| テスト関連パッケージの追加 | 完了 |
| `frontend/vitest.config.ts` 作成 | 完了 |
| `frontend/vitest.setup.ts` 作成 | 完了 |
| サンプルテスト作成（MessageInput） | 完了 |
| `package.json` へのスクリプト追加 | 完了 |
| `yarn test` 実行確認（6件成功） | 完了 |

### 9.3 追加されたファイル

* `frontend/vitest.config.ts` - Vitest 設定ファイル
* `frontend/vitest.setup.ts` - テストセットアップファイル
* `frontend/features/chat/components/message-input.test.tsx` - サンプルテスト

### 9.4 今後の拡張

* 他のコンポーネント・hooks・ユーティリティへのテスト追加
* MSW (Mock Service Worker) の導入（API モック）
* CI への組み込み（別指示書）
