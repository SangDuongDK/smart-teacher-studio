'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, LoginResponse } from '@/types/auth';
import { apiClient } from '@/lib/api-client';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Bọc bằng useCallback để giữ tham chiếu ổn định, thỏa mãn hook dependency
  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('current_user');
    setUser(null);
    router.push('/login');
  }, [router]);

  useEffect(() => {
    const verifyTokenOnLoad = async () => {
      const token = localStorage.getItem('access_token');

      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const response = await apiClient.get('/auth/me');
        setUser(response.data);
        localStorage.setItem('current_user', JSON.stringify(response.data));
      } catch {
        // Bỏ khai báo (error) vì không sử dụng -> hết lỗi no-unused-vars
        console.warn('Token không hợp lệ hoặc đã hết hạn, tiến hành đăng xuất...');
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    verifyTokenOnLoad();
  }, [logout]); // Đưa logout vào dependency array

  const login = (data: LoginResponse) => {
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('current_user', JSON.stringify(data.user));
    setUser(data.user);
    router.push('/dashboard');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};