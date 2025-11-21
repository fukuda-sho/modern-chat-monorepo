# フロントエンドコンポーネント命名規則の統一

## 概要
`frontend/src/components/` 配下の全てのコンポーネントファイル名をPascalCase（パスカルケース）に統一しました。

## 実施日時
2025-11-21

## 変更の目的
- コードの可読性と一貫性の向上
- Reactコンポーネントの一般的な命名規則への準拠
- TypeScript/Next.jsプロジェクトにおけるベストプラクティスの適用

## 変更内容

### 1. リネームされたファイル（11ファイル）

#### テストファイル（2ファイル）
- `login-form.test.tsx` → `LoginForm.test.tsx`
- `chat-message.test.tsx` → `ChatMessage.test.tsx`

#### UIコンポーネント（9ファイル）
- `avatar.tsx` → `Avatar.tsx`
- `button.tsx` → `Button.tsx`
- `card.tsx` → `Card.tsx`
- `dialog.tsx` → `Dialog.tsx`
- `form.tsx` → `Form.tsx`
- `input.tsx` → `Input.tsx`
- `label.tsx` → `Label.tsx`
- `scroll-area.tsx` → `ScrollArea.tsx`
- `sonner.tsx` → `Sonner.tsx`

### 2. import文の更新（7ファイル）

以下のファイルでimportパスを更新：

1. `frontend/src/app/room/[id]/page.tsx`
2. `frontend/src/components/ui/Form.tsx`
3. `frontend/src/components/layout/Sidebar.tsx`
4. `frontend/src/components/auth/LoginForm.tsx`
5. `frontend/src/app/layout.tsx`
6. `frontend/src/components/chat/ChatMessage.tsx`
7. `frontend/src/app/auth/signup/page.tsx`

## 検証結果

### ビルド確認
```bash
yarn build
```

**結果:** ✅ 成功
- コンパイルエラー: なし
- TypeScriptエラー: なし
- 全ルートの静的生成: 成功

### 影響範囲
- 変更ファイル数: 18ファイル（リネーム11 + import更新7）
- 影響を受けたimport文: 36箇所

## 命名規則

### 適用ルール
**PascalCase (パスカルケース)**
- コンポーネントをexportしているファイルは大文字開始
- 例: `Button.tsx`, `ChatInput.tsx`, `LoginForm.tsx`

### 適用対象外
以下のファイルは変更していません（Next.js App Routerのシステムファイル）：
- `page.tsx`
- `layout.tsx`
- `error.tsx`
- `loading.tsx`
- `not-found.tsx`

## 今後の方針
- 新規コンポーネント作成時はPascalCaseを使用
- shadcn/uiコンポーネントもPascalCaseで管理
- テストファイルもコンポーネント名に合わせてPascalCase使用

## 参考
- [React Naming Conventions](https://react.dev/learn/your-first-component#naming-a-component)
- [TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
