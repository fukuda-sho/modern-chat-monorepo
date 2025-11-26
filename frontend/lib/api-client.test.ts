/**
 * API クライアントのテスト
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiClient, ApiClientError } from "./api-client";

// fetch のモック
const mockFetch = vi.fn();
global.fetch = mockFetch;

// localStorage のモック
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
Object.defineProperty(window, "localStorage", { value: mockLocalStorage });

// constants のモック
vi.mock("./constants", () => ({
  API_BASE_URL: "http://localhost:3000/api",
  AUTH_TOKEN_KEY: "accessToken",
}));

describe("ApiClientError", () => {
  it("正しいプロパティを持つエラーインスタンスを作成する", () => {
    const error = new ApiClientError(401, "Unauthorized", "AUTH_ERROR");

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("ApiClientError");
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe("Unauthorized");
    expect(error.error).toBe("AUTH_ERROR");
  });
});

describe("apiClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("GET リクエスト", () => {
    it("正常なレスポンスを返す", async () => {
      const responseData = { id: 1, name: "Test" };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(responseData),
      });

      const result = await apiClient.get("/users/1");

      expect(result).toEqual(responseData);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain("/users/1");
      expect(options.method).toBe("GET");
    });

    it("クエリパラメータを正しく追加する", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      });

      await apiClient.get("/users", { params: { page: "1", limit: "10" } });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("page=1");
      expect(url).toContain("limit=10");
    });

    it("認証トークンがある場合、Authorization ヘッダーを追加する", async () => {
      mockLocalStorage.getItem.mockReturnValue("test-token");
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });

      await apiClient.get("/users");

      const fetchCall = mockFetch.mock.calls[0];
      const headers = fetchCall[1].headers;
      expect(headers.get("Authorization")).toBe("Bearer test-token");
    });

    it("エラーレスポンスで ApiClientError をスローする", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: () =>
          Promise.resolve({
            statusCode: 404,
            message: "User not found",
            error: "NOT_FOUND",
          }),
      });

      await expect(apiClient.get("/users/999")).rejects.toThrow(ApiClientError);
    });
  });

  describe("POST リクエスト", () => {
    it("正常なレスポンスを返す", async () => {
      const requestData = { name: "New User", email: "test@example.com" };
      const responseData = { id: 1, ...requestData };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(responseData),
      });

      const result = await apiClient.post("/users", requestData);

      expect(result).toEqual(responseData);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain("/users");
      expect(options.method).toBe("POST");
      expect(options.body).toBe(JSON.stringify(requestData));
    });

    it("Content-Type ヘッダーが application/json に設定される", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve({}),
      });

      await apiClient.post("/users", { name: "Test" });

      const fetchCall = mockFetch.mock.calls[0];
      const headers = fetchCall[1].headers;
      expect(headers.get("Content-Type")).toBe("application/json");
    });

    it("ボディなしでもリクエストできる", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });

      await apiClient.post("/action");

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain("/action");
      expect(options.method).toBe("POST");
      expect(options.body).toBeUndefined();
    });
  });

  describe("PUT リクエスト", () => {
    it("正常なレスポンスを返す", async () => {
      const requestData = { name: "Updated User" };
      const responseData = { id: 1, ...requestData };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(responseData),
      });

      const result = await apiClient.put("/users/1", requestData);

      expect(result).toEqual(responseData);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain("/users/1");
      expect(options.method).toBe("PUT");
      expect(options.body).toBe(JSON.stringify(requestData));
    });
  });

  describe("DELETE リクエスト", () => {
    it("正常なレスポンスを返す", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await apiClient.delete("/users/1");

      expect(result).toEqual({ success: true });
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain("/users/1");
      expect(options.method).toBe("DELETE");
    });

    it("204 No Content の場合は空オブジェクトを返す", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      const result = await apiClient.delete("/users/1");

      expect(result).toEqual({});
    });
  });

  describe("エラーハンドリング", () => {
    it("JSON パースに失敗した場合、ステータステキストを使用する", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: () => Promise.reject(new Error("Invalid JSON")),
      });

      await expect(apiClient.get("/error")).rejects.toMatchObject({
        statusCode: 500,
        message: "Internal Server Error",
      });
    });

    it("401 エラーを正しく処理する", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () =>
          Promise.resolve({
            statusCode: 401,
            message: "Unauthorized",
          }),
      });

      try {
        await apiClient.get("/protected");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiClientError);
        expect((error as ApiClientError).statusCode).toBe(401);
      }
    });
  });
});
