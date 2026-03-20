"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type User = {
  id: string;
  email: string;
  phone?: string;
  name?: string | null;
  avatarUrl?: string | null;
  roleFlags?: { is_buyer?: boolean; is_seller?: boolean } | null;
};

const AuthContext = createContext<{ user: User | null; loading: boolean; refetch: () => void }>({
  user: null,
  loading: true,
  refetch: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = () => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refetch: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
