"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  beginServerFavoriteSession,
  clearServerFavoriteCache,
  hydrateServerFavorites,
} from "@/lib/life-agent-favorites";

type User = {
  id: string;
  email: string;
  phone?: string;
  name?: string | null;
  avatarUrl?: string | null;
  roleFlags?: { is_buyer?: boolean; is_seller?: boolean } | null;
};

const AuthContext = createContext<{ user: User | null; loading: boolean; refetch: () => Promise<User | null> }>({
  user: null,
  loading: true,
  refetch: async () => null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 返回 Promise，调用方 await 后再跳转才能确保 user 已更新，避免登录后落地页出现「请先登录」闪烁。
  const fetchUser = async (): Promise<User | null> => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const data: User | null = res.ok ? await res.json() : null;
      setUser(data);
      return data;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (loading || typeof window === "undefined") return;
    if (user) {
      beginServerFavoriteSession();
      void hydrateServerFavorites();
    } else {
      clearServerFavoriteCache();
      window.dispatchEvent(new Event("la-favorite-change"));
    }
  }, [user, loading]);

  return (
    <AuthContext.Provider value={{ user, loading, refetch: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
