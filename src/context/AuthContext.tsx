import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '../types';
import * as api from '../api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  register: (data: api.RegisterData) => Promise<void>;
  login: (nickname: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateNickname: (nickname: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (api.getAccessToken()) {
      api.getMe()
        .then(setUser)
        .catch(() => api.clearTokens())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const register = async (data: api.RegisterData) => {
    const res = await api.register(data);
    setUser(res.user);
  };

  const login = async (nickname: string, password: string) => {
    const res = await api.login(nickname, password);
    setUser(res.user);
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const updateNickname = async (nickname: string) => {
    const updated = await api.updateNickname(nickname);
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, updateNickname }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
