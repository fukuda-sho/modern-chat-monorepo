# JSDocコメント記述ルール

## 概要

プロジェクトの保守性を向上させるため、BackendおよびFrontendのコードベース全体にJSDoc形式のコメントを追記します。

## 記述フォーマット

`/** ... */` 形式のJSDocを使用します。

```typescript
/**
 * 関数の説明
 * @param paramName 引数の説明
 * @returns 戻り値の説明
 * @throws ErrorType エラーが発生する条件
 */
```

## 記述言語

**日本語**を使用します。

## 必須タグ

### @param
引数の説明。TypeScriptで型情報は記述されているため、**ビジネス的な意味**を補足します。

**良い例:**
```typescript
/**
 * @param userId 認証済みユーザーのID（JWTトークンから取得）
 */
```

**悪い例:**
```typescript
/**
 * @param userId ユーザーID（型: string）
 */
```

### @returns
戻り値の説明。単なる型名ではなく、**返される値の意味やビジネス的な意図**を記述します。

**良い例:**
```typescript
/**
 * @returns 認証トークン（有効期限: 24時間）
 */
```

**悪い例:**
```typescript
/**
 * @returns string型のトークン
 */
```

### @throws
発生しうる例外と、その発生条件を明記します。

**例:**
```typescript
/**
 * @throws UnauthorizedException 認証トークンが無効または期限切れの場合
 * @throws NotFoundException 指定されたユーザーが存在しない場合
 */
```

## 対象範囲

### Backend (`backend/src/`)

#### 1. Controller
- APIエンドポイントの概要
- 必要な権限（Guard）
- 想定されるレスポンス
- リクエスト/レスポンスの例

**例:**
```typescript
/**
 * ユーザー登録エンドポイント
 *
 * 新規ユーザーを作成し、JWTトークンを返却します。
 * パスワードはbcryptでハッシュ化されて保存されます。
 *
 * @param signupDto ユーザー登録情報（メールアドレス、パスワード、表示名）
 * @returns 登録されたユーザー情報とJWTトークン
 * @throws ConflictException メールアドレスが既に使用されている場合
 */
@Post('signup')
async signup(@Body() signupDto: SignupDto) {
  // ...
}
```

#### 2. Service
- ビジネスロジックの詳細
- トランザクションの有無
- 例外処理の意図
- 副作用（データベース更新、外部API呼び出しなど）

**例:**
```typescript
/**
 * ユーザーを作成し、データベースに保存します
 *
 * パスワードはbcryptで自動的にハッシュ化されます。
 * メールアドレスの重複チェックは事前に行われている前提です。
 *
 * @param email ユーザーのメールアドレス（一意である必要がある）
 * @param password 平文のパスワード（8文字以上、ハッシュ化前）
 * @param name 表示名
 * @returns 作成されたユーザーエンティティ（パスワードフィールドは含まれない）
 * @throws Error データベースエラーが発生した場合
 */
async createUser(email: string, password: string, name: string) {
  // ...
}
```

#### 3. Gateway (WebSocket)
- WebSocketイベントのトリガー条件
- ブロードキャスト範囲
- イベントのデータ構造

**例:**
```typescript
/**
 * クライアントからのメッセージ送信イベント
 *
 * ルーム内の全ユーザーにメッセージをブロードキャストします。
 * 送信者の情報は自動的に付与されます。
 *
 * @param client 送信元のWebSocketクライアント
 * @param payload メッセージペイロード（ルームID、メッセージ内容）
 * @throws WsException ルームに参加していない、またはルームが存在しない場合
 */
@SubscribeMessage('sendMessage')
async handleMessage(
  @ConnectedSocket() client: Socket,
  @MessageBody() payload: SendMessageDto,
) {
  // ...
}
```

#### 4. DTO/Entity
- フィールドの制約条件
- バリデーションルール
- ビジネス上の意味

**例:**
```typescript
export class SignupDto {
  /**
   * ユーザーのメールアドレス
   * システム内で一意である必要があります
   */
  @IsEmail()
  email: string;

  /**
   * ユーザーのパスワード（平文）
   * データベースに保存される前にbcryptでハッシュ化されます
   * 最低8文字以上必要です
   */
  @IsString()
  @MinLength(8)
  password: string;

  /**
   * ユーザーの表示名
   * チャットルームで他のユーザーに表示されます
   */
  @IsString()
  @MinLength(1)
  name: string;
}
```

### Frontend (`frontend/`)

#### 1. Components
- コンポーネントの役割概要
- Propsの各フィールドの意味
- 使用例

**例:**
```typescript
/**
 * チャットメッセージを表示するコンポーネント
 *
 * 送信者のアバター、名前、メッセージ内容、送信時刻を表示します。
 * 自分が送信したメッセージと他のユーザーのメッセージで
 * 異なるスタイルが適用されます。
 *
 * @example
 * <ChatMessage
 *   message={{
 *     id: '1',
 *     content: 'Hello!',
 *     userId: 'user123',
 *     userName: 'John Doe',
 *     createdAt: new Date()
 *   }}
 *   isOwnMessage={false}
 * />
 */
interface ChatMessageProps {
  /**
   * 表示するメッセージオブジェクト
   */
  message: Message;

  /**
   * 現在のユーザーが送信したメッセージかどうか
   * trueの場合、右寄せで表示されます
   */
  isOwnMessage: boolean;
}

export function ChatMessage({ message, isOwnMessage }: ChatMessageProps) {
  // ...
}
```

#### 2. Hooks
- フックが管理する状態
- 提供する機能の概要
- 使用上の注意点

**例:**
```typescript
/**
 * WebSocket接続とチャット機能を管理するカスタムフック
 *
 * リアルタイムメッセージの送受信、ルームへの参加/退出を管理します。
 * コンポーネントのマウント時に自動的にWebSocket接続を確立し、
 * アンマウント時に接続を切断します。
 *
 * @param roomId 参加するチャットルームのID
 * @param userId 現在のユーザーのID
 * @returns メッセージ配列、送信関数、接続状態
 *
 * @example
 * const { messages, sendMessage, isConnected } = useSocket('room123', 'user456');
 *
 * // メッセージ送信
 * sendMessage('Hello, World!');
 */
export function useSocket(roomId: string, userId: string) {
  // ...
}
```

#### 3. Lib/Utils
- 関数の目的
- 引数と戻り値の詳細
- `@example` タグで使用例を提供

**例:**
```typescript
/**
 * 日付を相対的な時間表記に変換します
 *
 * 現在時刻からの経過時間に応じて、適切な表現を返します：
 * - 1分未満: "たった今"
 * - 1時間未満: "○分前"
 * - 24時間未満: "○時間前"
 * - それ以上: "YYYY/MM/DD HH:mm"
 *
 * @param date 変換する日付オブジェクト
 * @returns 相対時間の文字列表現
 *
 * @example
 * formatRelativeTime(new Date(Date.now() - 5 * 60 * 1000))
 * // => "5分前"
 *
 * @example
 * formatRelativeTime(new Date('2024-01-01'))
 * // => "2024/01/01 00:00"
 */
export function formatRelativeTime(date: Date): string {
  // ...
}
```

## 禁止事項

### 自明なコメントの禁止

メソッド名や変数名から明らかな内容だけを記述するコメントは避けてください。

**悪い例:**
```typescript
/**
 * ユーザーを取得する
 * @param id ユーザーID
 * @returns ユーザー
 */
async getUser(id: string) {
  // ...
}
```

**良い例:**
```typescript
/**
 * ユーザー情報をデータベースから取得します
 *
 * 削除済みのユーザーは取得されません。
 * 存在しないIDの場合はnullを返します。
 *
 * @param id 取得対象のユーザーID
 * @returns ユーザーエンティティ（存在しない場合はnull）
 */
async getUser(id: string) {
  // ...
}
```

### 記述すべき内容

コメントでは以下の情報を重視してください：

1. **どのような条件で**: 実行の前提条件、入力の制約
2. **何のために**: ビジネス上の目的、なぜこの処理が必要か
3. **どのような影響が**: 副作用、他のシステムへの影響
4. **どのような例外が**: エラーケースとその対処

## コメント更新の方針

- コードを変更した際は、必ずコメントも更新する
- 古いコメントは技術的負債となるため、正確性を保つ
- 不明瞭な実装は、コメントではなくリファクタリングで解決する

## チェックリスト

JSDocを追記する際は、以下を確認してください：

- [ ] `@param`、`@returns`、`@throws`を適切に記述した
- [ ] 日本語で記述した
- [ ] 型情報だけでなく、ビジネス的な意味を記述した
- [ ] 自明な内容だけのコメントになっていない
- [ ] 「どのような条件で」「何のために」が明確になっている
- [ ] 例外の発生条件を記述した
- [ ] 必要に応じて`@example`を追加した（Utility関数）
