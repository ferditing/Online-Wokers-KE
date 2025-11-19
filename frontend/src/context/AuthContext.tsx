// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";
import type { ReactNode } from "react";

type User = {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
  verified?: boolean;
  skills?: string[];
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  /**
   * login(email, password) -> performs POST /auth/login, stores token, fetches /auth/me
   * Also keep login(token,user) overloaded-compatible method (rare) as loginWithToken
   */
  login: (email: string, password: string) => Promise<void>;
  loginWith?: (token: string, user: User) => void; // alias for legacy calls
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const TOKEN_KEY = "ow_token";

  // helper: persist token and set axios header
  function setToken(token: string | null) {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      localStorage.removeItem(TOKEN_KEY);
      delete api.defaults.headers.common["Authorization"];
    }
  }

  // refresh user from backend
  const refreshUser = async () => {
    try {
      const res = await api.get("/auth/me");
      // backend may return { user } or just user as root
      const u = res.data?.user ?? res.data;
      setUser(u || null);
      return u;
    } catch (err) {
      // invalid token or server error -> clear user and token
      setUser(null);
      setToken(null);
      throw err;
    }
  };

  // init: attach token (if any) then call /auth/me
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const stored = localStorage.getItem(TOKEN_KEY);
        if (stored) {
          api.defaults.headers.common["Authorization"] = `Bearer ${stored}`;
          await refreshUser();
        } else {
          setUser(null);
        }
      } catch (err) {
        // refreshUser already cleared token if invalid
        console.warn("Auth init: could not refresh user", err);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Primary login function used by Login.tsx: login(email,password)
  async function login(email: string, password: string) {
    // call backend
    const res = await api.post("/auth/login", { email, password });
    // adapt to common response shapes
    const token = res.data?.token ?? res.data?.accessToken ?? res.data?.data?.token;
    if (!token) throw new Error("No token returned from login");
    setToken(token);
    // fetch and set user
    await refreshUser();
  }

  // Backwards compatibility: if some code calls loginWith(token,user)
  const loginWith = (token: string, u: User) => {
    setToken(token);
    setUser(u);
  };

  function logout() {
    setToken(null);
    setUser(null);
    // do not navigate here — let caller choose redirect, or the UI can call navigate
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWith, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
