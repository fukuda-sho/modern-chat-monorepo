/**
 * ユーティリティ関数のテスト
 */

import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn (className merge utility)", () => {
  it("単一のクラス名を返す", () => {
    expect(cn("foo")).toBe("foo");
  });

  it("複数のクラス名をマージする", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("条件付きクラス名を処理する", () => {
    expect(cn("foo", true && "bar", false && "baz")).toBe("foo bar");
  });

  it("undefined や null を無視する", () => {
    expect(cn("foo", undefined, null, "bar")).toBe("foo bar");
  });

  it("空文字を無視する", () => {
    expect(cn("foo", "", "bar")).toBe("foo bar");
  });

  it("配列形式のクラス名を処理する", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });

  it("オブジェクト形式の条件付きクラス名を処理する", () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
  });

  describe("Tailwind CSS クラスのマージ", () => {
    it("競合する Tailwind クラスを最後のもので上書きする", () => {
      // p-4 と p-2 は競合するので、後者が優先される
      expect(cn("p-4", "p-2")).toBe("p-2");
    });

    it("異なるプロパティの Tailwind クラスは両方保持する", () => {
      expect(cn("p-4", "m-2")).toBe("p-4 m-2");
    });

    it("text-color クラスの競合を解決する", () => {
      expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    });

    it("bg-color クラスの競合を解決する", () => {
      expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
    });

    it("同じ軸の margin/padding クラスの競合を解決する", () => {
      expect(cn("mt-4", "mt-8")).toBe("mt-8");
      expect(cn("px-2", "px-4")).toBe("px-4");
    });

    it("異なる軸の margin/padding クラスは両方保持する", () => {
      expect(cn("mt-4", "mb-4")).toBe("mt-4 mb-4");
      expect(cn("px-2", "py-4")).toBe("px-2 py-4");
    });

    it("flex 関連クラスの競合を解決する", () => {
      expect(cn("flex-row", "flex-col")).toBe("flex-col");
      expect(cn("justify-start", "justify-center")).toBe("justify-center");
    });

    it("複雑な条件付きクラス名を正しく処理する", () => {
      const isActive = true;
      const isDisabled = false;

      const result = cn(
        "base-class",
        "p-4",
        isActive && "bg-blue-500",
        isDisabled && "opacity-50",
        "p-2" // p-4 を上書き
      );

      expect(result).toBe("base-class bg-blue-500 p-2");
    });
  });
});
