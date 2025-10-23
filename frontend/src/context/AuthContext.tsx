import React, { createContext, useContext, useEffect, useState } from 'react';
import * as authService from '../services/auth.service';

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  verified?: boolean;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: { name: string; email: string; password: string; role?: 'worker'|'employer' }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function bootstrap() {
    const token = localStorage.getItem('owk_token');
    if (!token) { setLoading(false); return; }
    try {
      const res = await authService.me();
      setUser(res.user);
    } catch {
      localStorage.removeItem('owk_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    bootstrap();
  }, []);

  async function login(email: string, password: string) {
    const res = await authService.login({ email, password });
    localStorage.setItem('owk_token', res.token);
    setUser(res.user);
  }

  async function register(payload: { name: string; email: string; password: string; role?: 'worker'|'employer' }) {
    const res = await authService.register(payload);
    localStorage.setItem('owk_token', res.token);
    setUser(res.user);
  }

  function logout() {
    localStorage.removeItem('owk_token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
