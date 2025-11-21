# 型定義の強化と `any` 型の撲滅

## 概要

本ドキュメントでは、TypeScriptプロジェクトにおける型安全性の向上を目的とし、`any`型の使用を撤廃し、厳密な型定義を導入する戦略を定義します。

## 基本方針

### 1. `any` 型の使用禁止

- **原則**: `any`型の使用を全面的に禁止する
- **代替手段**:
  - Generics (`<T>`) の活用
  - Utility Types (`Partial<T>`, `Pick<T, K>`, `Omit<T, K>` など) の活用
  - `unknown` 型の使用（型ガードと組み合わせる）
  - 適切な型定義の作成

### 2. パッケージ管理

- パッケージの追加・更新は `yarn add` を使用する
- 型定義パッケージは `yarn add -D @types/...` で追加する

### 3. 型定義の集約

- Frontend: `frontend/types/` ディレクトリに型定義を集約
- Backend: DTOクラスとEntityクラスで型を管理

## Backend (NestJS) 型戦略

### 1. Controller の型定義

#### 原則
- すべてのメソッドに明示的な戻り値の型を指定する
- DTOクラスまたはEntityクラスを使用する
- `@Body()`, `@Query()`, `@Param()` には必ずDTOクラスを指定する

#### 例
```typescript
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('signup')
  async signup(@Body() signupDto: SignupDto): Promise<UserResponseDto> {
    return this.authService.signup(signupDto);
  }
}
```

### 2. Service の型定義

#### 原則
- すべてのメソッドに戻り値の型を明示する
- Prismaの型を活用する（`Prisma.UserCreateInput` など）
- 機密情報（パスワードなど）は除外した型を返す

#### 例
```typescript
@Injectable()
export class AuthService {
  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    // implementation
  }

  async signup(signupDto: SignupDto): Promise<UserResponseDto> {
    // implementation
  }
}
```

### 3. DTO (Data Transfer Object)

#### 原則
- `class-validator` を使用したバリデーション
- `class-transformer` を使用した変換処理
- Responseにはパスワードなどの機密情報を含めない

#### ディレクトリ構造
```
backend/src/
├── auth/
│   └── dto/
│       ├── login.dto.ts
│       ├── signup.dto.ts
│       ├── login-response.dto.ts
│       └── user-response.dto.ts
├── users/
│   └── dto/
│       └── user-response.dto.ts
└── chat/
    └── dto/
        ├── create-message.dto.ts
        ├── join-room.dto.ts
        └── message-response.dto.ts
```

### 4. Gateway (WebSocket) の型定義

#### 原則
- WebSocketイベントのペイロードに型を定義する
- `@MessageBody()` には必ずDTOクラスを指定する

#### 例
```typescript
@WebSocketGateway()
export class ChatGateway {
  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: SendMessageDto,
    @ConnectedSocket() client: Socket,
  ): Promise<MessageResponseDto> {
    // implementation
  }
}
```

## Frontend (Next.js) 型戦略

### 1. 型定義ファイルの構造

```
frontend/types/
├── entity.ts          # Prismaモデルに対応する型
├── api.ts             # APIレスポンス型
├── form.ts            # フォームデータ型
└── websocket.ts       # WebSocketイベント型
```

### 2. Entity型定義 (`types/entity.ts`)

#### 原則
- Backendのデータベースモデルに対応
- 機密情報（パスワード）は含めない
- オプショナルなフィールドは `?` を使用

#### 例
```typescript
export interface User {
  id: number;
  username: string;
  email: string;
  createdAt: Date | string;
}

export interface ChatRoom {
  id: number;
  name: string;
  createdAt: Date | string;
  users?: User[];
  messages?: Message[];
}

export interface Message {
  id: number;
  content: string;
  createdAt: Date | string;
  userId: number;
  user?: User;
  chatRoomId: number;
  chatRoom?: ChatRoom;
}
```

### 3. API型定義 (`types/api.ts`)

#### 原則
- APIレスポンスの形状を定義
- `AxiosResponse<T>` の `T` に具体的な型を指定

#### 例
```typescript
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
}

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  createdAt: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}
```

### 4. React Hooks の型定義

#### 原則
- `useState` には必ず初期値の型を指定
- `useEffect` の依存配列は厳密に管理
- カスタムフックは戻り値の型を明示

#### 例
```typescript
// Before (NG)
const [user, setUser] = useState(null);
const [data, setData] = useState();

// After (OK)
const [user, setUser] = useState<User | null>(null);
const [data, setData] = useState<ApiResponse | undefined>(undefined);

// Custom Hook
function useAuth(): {
  user: User | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
} {
  const [user, setUser] = useState<User | null>(null);

  const login = async (credentials: LoginRequest) => {
    // implementation
  };

  const logout = () => {
    // implementation
  };

  return { user, login, logout };
}
```

### 5. API Client の型定義

#### 原則
- `axios` のレスポンスに型を指定
- エラーハンドリングに型ガードを使用

#### 例
```typescript
import api from '@/lib/api';
import type { LoginRequest, LoginResponse, UserResponse } from '@/types/api';

export const authApi = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  async signup(data: SignupRequest): Promise<UserResponse> {
    const response = await api.post<UserResponse>('/auth/signup', data);
    return response.data;
  },
};
```

## 実装優先順位

### Phase 1: 型定義ファイルの作成
1. `frontend/types/entity.ts` の作成
2. `frontend/types/api.ts` の作成
3. Backend Response DTOの作成

### Phase 2: Backend型適用
1. Controller の戻り値型を明示
2. Service の戻り値型を明示
3. Gateway の型定義を追加

### Phase 3: Frontend型適用
1. API呼び出しに型を追加
2. useState, useEffectに型を追加
3. Componentのpropsに型を追加

### Phase 4: `any` の撲滅
1. コードベース全体をスキャン
2. `any` を適切な型に置換
3. ESLintルールで `any` 使用を禁止

## ESLint設定

### Backend (`backend/.eslintrc.js`)
```javascript
module.exports = {
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',
    '@typescript-eslint/no-unsafe-return': 'error',
  },
};
```

### Frontend (`frontend/.eslintrc.js`)
```javascript
module.exports = {
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
  },
};
```

## チェックリスト

### Backend
- [ ] すべてのControllerメソッドに戻り値型が指定されている
- [ ] すべての`@Body()`, `@Param()`, `@Query()`にDTOが指定されている
- [ ] すべてのServiceメソッドに戻り値型が指定されている
- [ ] Response DTOにパスワードなどの機密情報が含まれていない
- [ ] Gateway のメッセージハンドラに型が指定されている

### Frontend
- [ ] `types/` ディレクトリが作成されている
- [ ] すべてのAPI呼び出しに型が指定されている
- [ ] すべての`useState`に型が指定されている
- [ ] すべてのComponentのpropsに型が指定されている
- [ ] `any` 型が使用されていない

## まとめ

この戦略に従うことで、以下のメリットが得られます：

1. **型安全性の向上**: コンパイル時にエラーを検出できる
2. **IDE補完の向上**: より正確なコード補完が可能になる
3. **リファクタリングの安全性**: 型エラーで影響範囲を把握できる
4. **ドキュメント効果**: 型定義自体がドキュメントとして機能する
5. **バグの早期発見**: ランタイムエラーを防ぐことができる
