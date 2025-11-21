"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { AxiosInstance } from "axios";

import { createApiClient } from "@/lib/api";
import type { RuntimeEnvConfig } from "@/types";

type EnvContextValue = RuntimeEnvConfig & {
  apiClient: AxiosInstance;
};

const EnvContext = createContext<EnvContextValue | undefined>(undefined);

interface EnvProviderProps {
  apiUrl: string;
  children: ReactNode;
}

export function EnvProvider({ apiUrl, children }: EnvProviderProps) {
  const value = useMemo<EnvContextValue>(() => {
    const normalizedApiUrl = apiUrl.replace(/\/$/, "");
    const socketUrl = normalizedApiUrl.replace(/\/?api$/, "");

    return {
      apiUrl: normalizedApiUrl,
      socketUrl,
      apiClient: createApiClient(normalizedApiUrl),
    };
  }, [apiUrl]);

  return <EnvContext.Provider value={value}>{children}</EnvContext.Provider>;
}

export function useEnv(): EnvContextValue {
  const context = useContext(EnvContext);
  if (!context) {
    throw new Error("useEnv must be used within EnvProvider");
  }

  return context;
}
