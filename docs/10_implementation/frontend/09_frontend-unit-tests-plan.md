# 09. フロントエンド単体テストコード作成設計書（優先度定義・対象一覧・ベストプラクティス）

## 0. ファイル情報

- パス: `docs/10_implementation/frontend/09_frontend-unit-tests-plan.md`
- 対象: フロントエンドアプリケーション（`frontend/` ディレクトリ配下）
- 目的:
  - 既に導入したテスト環境（Vitest + React Testing Library）を前提に、
    **「どのコードに対して、どのような単体テストを書くか」** を定義する。
  - 現在存在しているフロントエンドコードのうち、テストが特に重要な部分に対し、
    ベストプラクティスに沿ったテストコードを計画的に追加する。

---

## 1. 目的・スコープ

### 1.1 目的

- チャットアプリケーションのフロントエンドにおいて、以下のような観点のテストを充実させる：
  - **クリティカルパス（ログイン〜チャット送受信）の動作確認**
  - **ビジネスロジックを含むカスタムフック / ストアの検証**
  - **バグが入りやすい UI コンポーネント / ユーティリティの検証**
- すべてを一気に 100% カバーするのではなく、
  **優先度を決めて段階的にカバレッジを上げる**指針を定義する。

### 1.2 スコープ

- **対象とするテスト種別**
  - 単体テスト（ユニットテスト）：
    - React コンポーネント（UI）
    - カスタムフック（状態管理 / WebSocket）
    - ライブラリ / ユーティリティ関数
- **対象外**
  - E2E テスト（Playwright 等）：別指示書で扱う
  - 見た目だけのスナップショットテスト（基本やらない方針）

---

## 2. テスト対象の優先順位付け

### 2.1 優先度分類

テスト対象を以下の 3 ランクに分ける。

- **P1（最優先）**
  - クリティカルな機能の中心ロジック：
    - ログインフォーム / 認証フローの UI ロジック
    - チャット投稿（メッセージ入力 → 送信ハンドラ）の処理
    - チャットルームの基本表示（メッセージ一覧）
  - バグが出やすい状態管理 / フック：
    - WebSocket 接続フック（例：`useChatSocket`）
    - Zustand ストア（メッセージ / ルーム状態）

- **P2（優先）**
  - ユーティリティ関数（フォーマット / バリデーションなど）
  - 共通 UI コンポーネント（モーダル、共通ボタンで重要なもの）
  - API クライアントレイヤ（fetch ラッパー）※ユニット範囲に留める

- **P3（余力があれば）**
  - 装飾メインのコンポーネント（純粋なレイアウトなど）
  - 単純なラッパーコンポーネント

---

## 3. 現在のコードに対するテスト対象マッピング

### 3.1 認証まわり（P1）

- ディレクトリ：
  - `frontend/features/auth/components/`
  - `frontend/features/auth/schemas/`
  - `frontend/features/auth/hooks/`

**テスト対象**

| ファイル | テストファイル | 優先度 |
|----------|---------------|--------|
| `login-form.tsx` | `login-form.test.tsx` | P1 |
| `signup-form.tsx` | `signup-form.test.tsx` | P1 |
| `login-schema.ts` | `login-schema.test.ts` | P2 |
| `signup-schema.ts` | `signup-schema.test.ts` | P2 |

**テスト観点**

1. `LoginForm` コンポーネント
   - 正しい入力時に `onSubmit` が期待通り呼ばれる
   - バリデーションエラー時にエラーメッセージが表示される
   - ローディング中はボタンが disabled になる

2. `SignupForm` コンポーネント
   - 必須項目のバリデーション
   - パスワード確認の一致チェック

### 3.2 チャット画面（P1）

- ディレクトリ：
  - `frontend/features/chat/components/`

**テスト対象**

| ファイル | テストファイル | 優先度 | 状況 |
|----------|---------------|--------|------|
| `message-input.tsx` | `message-input.test.tsx` | P1 | 完了 |
| `message-list.tsx` | `message-list.test.tsx` | P1 | 未作成 |
| `message-item.tsx` | `message-item.test.tsx` | P2 | 未作成 |
| `room-list.tsx` | `room-list.test.tsx` | P1 | 未作成 |
| `room-item.tsx` | `room-item.test.tsx` | P2 | 未作成 |

**テスト観点**

1. `MessageInput` コンポーネント（完了）
   - テキスト入力 → 送信ボタン → `onSend` 呼び出し
   - 空文字 / 空白のみの場合は送信されない

2. `MessageList` コンポーネント
   - 与えられたメッセージ配列が順番通りレンダリングされる

3. `RoomList` コンポーネント
   - ルーム配列を受け取り、一覧表示する
   - クリックされたルームの選択処理

### 3.3 Hooks / ストア（P1）

- ディレクトリ：
  - `frontend/features/chat/hooks/`
  - `frontend/features/chat/store/`

**テスト対象**

| ファイル | テストファイル | 優先度 |
|----------|---------------|--------|
| `use-chat-socket.ts` | `use-chat-socket.test.ts` | P1 |
| `chat-store.ts` | `chat-store.test.ts` | P1 |
| `use-messages.ts` | `use-messages.test.ts` | P2 |

**テスト観点**

1. `useChatSocket`（ロジック部分）
   - 接続時に join イベントを送る
   - message イベントを受け取った際にストアへ反映する
   - クリーンアップ時に leave / disconnect を呼び出す

2. `chat-store`（Zustand）
   - `addMessage` / `setMessages` / `setCurrentRoom` など、ステート操作関数の動作

### 3.4 ユーティリティ / ライブラリ（P2）

- ディレクトリ：
  - `frontend/lib/`

**テスト対象**

| ファイル | テストファイル | 優先度 |
|----------|---------------|--------|
| `utils.ts` | `utils.test.ts` | P2 |
| `api-client.ts` | `api-client.test.ts` | P2 |

---

## 4. テスト設計のベストプラクティス

### 4.1 基本原則

1. **ユーザー視点を優先**
   - React Testing Library を使い、「役割（`getByRole`）」「ラベル（`getByLabelText`）」で要素を取得する。
   - DOM の構造や className には依存しない。

2. **実装詳細をテストしすぎない**
   - 内部でどの hook を何回呼んだか、よりも「ユーザーの操作に対して何が起きるか」を見る。
   - ただし Zustand ストアや hooks のような pure ロジックはある程度実装寄りのテストで問題ない。

3. **スナップショットテストを乱用しない**
   - 意味のある振る舞い（テキスト表示 / イベント発火）に焦点を当てる。

4. **1 テストケース 1 主張（できるだけ）**
   - 「テキスト入力して送信できる」と「空文字では送信されない」は別テストケースに分ける。

### 4.2 テストコードスタイル（例）

- AAA パターン（Arrange / Act / Assert）を意識する：

```ts
it("送信ボタンを押すと onSend が呼ばれる", async () => {
  // Arrange
  const user = userEvent.setup();
  const handleSend = vi.fn();
  render(<MessageInput onSend={handleSend} />);

  // Act
  const input = screen.getByPlaceholderText("メッセージ入力");
  await user.type(input, "hello");
  await user.click(screen.getByRole("button", { name: "送信" }));

  // Assert
  expect(handleSend).toHaveBeenCalledWith("hello");
});
```

---

## 5. 完了条件

* P1 対象として列挙された主要コンポーネント・フック・ストアに対し、最低 1 つ以上の意味のある単体テストが存在する。
* `frontend` ディレクトリで `yarn test` を実行し、すべての P1 テストが成功する。
* 新規参加メンバーが本ドキュメントと既存テストコードを見れば、
  * どの領域がテストされているか、
  * 自分が追加するコードに対してどのレベルのテストを書けばよいか
    が分かる状態になっている。
