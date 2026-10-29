'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Loader2 } from 'lucide-react';
import { isAxiosError } from 'axios';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleManualSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    // 1. Chặn trình duyệt reload trang tuyệt đối
    e.preventDefault();
    e.stopPropagation();

    if (!email || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const response = await apiClient.post('/auth/login', {
        email,
        password,
      });

      // Đăng nhập thành công
      login(response.data);
    } catch (err: unknown) {
    if (isAxiosError(err)) {
        const serverMessage = err.response?.data?.message;
        setErrorMessage(
        Array.isArray(serverMessage)
            ? serverMessage.join(', ')
            : serverMessage || 'Email hoặc mật khẩu không chính xác.'
        );
    } else {
        setErrorMessage('Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.');
    }
    }finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <GraduationCap className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Smart Teacher Studio AI</CardTitle>
          <CardDescription>Hệ thống hỗ trợ tạo học liệu Tiếng Anh K-9 thông minh</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleManualSubmit} noValidate className="space-y-4">
            {errorMessage && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-600 font-medium">
                {errorMessage}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@smartteacher.edu.vn"
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isSubmitting}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Đăng nhập'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}