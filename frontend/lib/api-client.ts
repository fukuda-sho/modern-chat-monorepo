/**
 * HTTP API クライアント
 * fetch ベースの型安全な API クライアント
 */

import { API_BASE_URL, AUTH_TOKEN_KEY } from './constants';
import type { ApiError } from '@/types';

interface RequestConfig extends RequestInit {
  params?: Record<string, string>;
}

/**
 * API エラークラス
 */
export class ApiClientError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public error?: string
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

/**
 * 認証トークンを取得
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

/**
 * リクエストヘッダーを構築
 */
function buildHeaders(customHeaders?: HeadersInit): Headers {
  const headers = new Headers(customHeaders);

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return headers;
}

/**
 * レスポンスを処理
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({
      statusCode: response.status,
      message: response.statusText,
    }));

    throw new ApiClientError(
      errorData.statusCode || response.status,
      errorData.message || 'An error occurred',
      errorData.error
    );
  }

  // 204 No Content の場合は空オブジェクトを返す
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

/**
 * API クライアント
 */
export const apiClient = {
  /**
   * GET リクエスト
   */
  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    const url = new URL(endpoint, API_BASE_URL);

    if (config?.params) {
      Object.entries(config.params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      ...config,
      method: 'GET',
      headers: buildHeaders(config?.headers),
    });

    return handleResponse<T>(response);
  },

  /**
   * POST リクエスト
   */
  async post<T>(
    endpoint: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    const url = new URL(endpoint, API_BASE_URL);

    const response = await fetch(url.toString(), {
      ...config,
      method: 'POST',
      headers: buildHeaders(config?.headers),
      body: data ? JSON.stringify(data) : undefined,
    });

    return handleResponse<T>(response);
  },

  /**
   * PUT リクエスト
   */
  async put<T>(
    endpoint: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    const url = new URL(endpoint, API_BASE_URL);

    const response = await fetch(url.toString(), {
      ...config,
      method: 'PUT',
      headers: buildHeaders(config?.headers),
      body: data ? JSON.stringify(data) : undefined,
    });

    return handleResponse<T>(response);
  },

  /**
   * DELETE リクエスト
   */
  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    const url = new URL(endpoint, API_BASE_URL);

    const response = await fetch(url.toString(), {
      ...config,
      method: 'DELETE',
      headers: buildHeaders(config?.headers),
    });

    return handleResponse<T>(response);
  },
};
