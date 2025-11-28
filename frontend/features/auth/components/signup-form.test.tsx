/**
 * サインアップフォームコンポーネントのテスト
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SignupForm } from "./signup-form";

// next/navigation のモック
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

// useSignup のモック
const mockSignup = vi.fn();
vi.mock("../hooks/use-signup", () => ({
  useSignup: () => ({
    mutate: mockSignup,
    isPending: false,
    error: null,
  }),
}));

describe("SignupForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("全ての入力フィールドが表示される", () => {
    render(<SignupForm />);

    expect(screen.getByLabelText("ユーザー名")).toBeInTheDocument();
    expect(screen.getByLabelText("メールアドレス")).toBeInTheDocument();
    expect(screen.getByLabelText("パスワード")).toBeInTheDocument();
    expect(screen.getByLabelText("パスワード（確認）")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "アカウント作成" })
    ).toBeInTheDocument();
  });

  it("有効なデータで送信すると signup が呼ばれる", async () => {
    const user = userEvent.setup();

    mockSignup.mockImplementation((data, options) => {
      options?.onSuccess?.();
    });

    render(<SignupForm />);

    await user.type(screen.getByLabelText("ユーザー名"), "testuser");
    await user.type(
      screen.getByLabelText("メールアドレス"),
      "test@example.com"
    );
    await user.type(screen.getByLabelText("パスワード"), "password123");
    await user.type(screen.getByLabelText("パスワード（確認）"), "password123");
    await user.click(screen.getByRole("button", { name: "アカウント作成" }));

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith(
        {
          username: "testuser",
          email: "test@example.com",
          password: "password123",
        },
        expect.objectContaining({
          onSuccess: expect.any(Function),
        })
      );
    });
  });

  it("サインアップ成功時に /login?registered=true へ遷移する", async () => {
    const user = userEvent.setup();

    mockSignup.mockImplementation((data, options) => {
      options?.onSuccess?.();
    });

    render(<SignupForm />);

    await user.type(screen.getByLabelText("ユーザー名"), "testuser");
    await user.type(
      screen.getByLabelText("メールアドレス"),
      "test@example.com"
    );
    await user.type(screen.getByLabelText("パスワード"), "password123");
    await user.type(screen.getByLabelText("パスワード（確認）"), "password123");
    await user.click(screen.getByRole("button", { name: "アカウント作成" }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/login?registered=true");
    });
  });

  describe("ユーザー名のバリデーション", () => {
    it("ユーザー名が空の場合、エラーが表示される", async () => {
      const user = userEvent.setup();
      render(<SignupForm />);

      await user.type(
        screen.getByLabelText("メールアドレス"),
        "test@example.com"
      );
      await user.type(screen.getByLabelText("パスワード"), "password123");
      await user.type(
        screen.getByLabelText("パスワード（確認）"),
        "password123"
      );
      await user.click(screen.getByRole("button", { name: "アカウント作成" }));

      await waitFor(() => {
        expect(screen.getByText("ユーザー名は必須です")).toBeInTheDocument();
      });
    });

    it("ユーザー名が3文字未満の場合、エラーが表示される", async () => {
      const user = userEvent.setup();
      render(<SignupForm />);

      await user.type(screen.getByLabelText("ユーザー名"), "ab");
      await user.type(
        screen.getByLabelText("メールアドレス"),
        "test@example.com"
      );
      await user.type(screen.getByLabelText("パスワード"), "password123");
      await user.type(
        screen.getByLabelText("パスワード（確認）"),
        "password123"
      );
      await user.click(screen.getByRole("button", { name: "アカウント作成" }));

      await waitFor(() => {
        expect(
          screen.getByText("ユーザー名は3文字以上で入力してください")
        ).toBeInTheDocument();
      });
    });

    it("ユーザー名に無効な文字が含まれる場合、エラーが表示される", async () => {
      const user = userEvent.setup();
      render(<SignupForm />);

      await user.type(screen.getByLabelText("ユーザー名"), "user@name!");
      await user.type(
        screen.getByLabelText("メールアドレス"),
        "test@example.com"
      );
      await user.type(screen.getByLabelText("パスワード"), "password123");
      await user.type(
        screen.getByLabelText("パスワード（確認）"),
        "password123"
      );
      await user.click(screen.getByRole("button", { name: "アカウント作成" }));

      await waitFor(() => {
        expect(
          screen.getByText(
            "ユーザー名は英数字とアンダースコアのみ使用できます"
          )
        ).toBeInTheDocument();
      });
    });
  });

  describe("メールアドレスのバリデーション", () => {
    it("メールアドレスが空の場合、エラーが表示される", async () => {
      const user = userEvent.setup();
      render(<SignupForm />);

      await user.type(screen.getByLabelText("ユーザー名"), "testuser");
      await user.type(screen.getByLabelText("パスワード"), "password123");
      await user.type(
        screen.getByLabelText("パスワード（確認）"),
        "password123"
      );
      await user.click(screen.getByRole("button", { name: "アカウント作成" }));

      await waitFor(() => {
        expect(
          screen.getByText("メールアドレスは必須です")
        ).toBeInTheDocument();
      });
    });

    // Note: 無効なメールアドレス形式のテストは省略
    // ブラウザの native validation (type="email") が先に実行されるため、
    // Zod のカスタムエラーメッセージは表示されない
  });

  describe("パスワードのバリデーション", () => {
    it("パスワードが8文字未満の場合、エラーが表示される", async () => {
      const user = userEvent.setup();
      render(<SignupForm />);

      await user.type(screen.getByLabelText("ユーザー名"), "testuser");
      await user.type(
        screen.getByLabelText("メールアドレス"),
        "test@example.com"
      );
      await user.type(screen.getByLabelText("パスワード"), "short");
      await user.type(screen.getByLabelText("パスワード（確認）"), "short");
      await user.click(screen.getByRole("button", { name: "アカウント作成" }));

      await waitFor(() => {
        expect(
          screen.getByText("パスワードは8文字以上で入力してください")
        ).toBeInTheDocument();
      });
    });

    it("パスワード確認が一致しない場合、エラーが表示される", async () => {
      const user = userEvent.setup();
      render(<SignupForm />);

      await user.type(screen.getByLabelText("ユーザー名"), "testuser");
      await user.type(
        screen.getByLabelText("メールアドレス"),
        "test@example.com"
      );
      await user.type(screen.getByLabelText("パスワード"), "password123");
      await user.type(
        screen.getByLabelText("パスワード（確認）"),
        "different456"
      );
      await user.click(screen.getByRole("button", { name: "アカウント作成" }));

      await waitFor(() => {
        expect(screen.getByText("パスワードが一致しません")).toBeInTheDocument();
      });
    });
  });
});
