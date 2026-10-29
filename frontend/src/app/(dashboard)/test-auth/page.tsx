'use client';

import { useState } from 'react';
import { isAxiosError } from 'axios';
import { apiClient } from '@/lib/api-client';
import { User } from '@/types/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';

export default function TestAuthPage() {
  const [profileData, setProfileData] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  // Test Request Interceptor: Tự gắn Bearer token
  const handleTestInterceptor = async () => {
    try {
      setLoading(true);
      setErrorStatus(null);
      const res = await apiClient.get<User>('/auth/me');
      setProfileData(res.data);
    } catch (err: unknown) {
      if (isAxiosError<{ message?: string }>(err)) {
        setErrorStatus(err.response?.data?.message || err.message);
      } else if (err instanceof Error) {
        setErrorStatus(err.message);
      } else {
        setErrorStatus('Đã xảy ra lỗi không xác định.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Test Response Interceptor: Bắt lỗi 401 tự logout
  const handleSimulateExpiredToken = async () => {
    localStorage.setItem('access_token', 'invalid_expired_token_12345');
    try {
      setLoading(true);
      await apiClient.get('/auth/me');
    } catch (err: unknown) {
      console.warn('Response Interceptor kích hoạt xử lý 401:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="border-blue-200 bg-blue-50/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-base text-blue-900">Môi trường kiểm thử Interceptor</CardTitle>
          </div>
          <CardDescription>
            Trang dành riêng cho việc nghiệm thu kỹ thuật Axios Interceptor và cơ chế Auto-Logout[cite: 1, 2].
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button onClick={handleTestInterceptor} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Gọi GET /auth/me
            </Button>

            <Button onClick={handleSimulateExpiredToken} variant="destructive" disabled={loading} className="gap-2">
              <AlertCircle className="h-4 w-4" />
              Thử nghiệm Token hỏng (401)
            </Button>
          </div>

          {profileData && (
            <div className="rounded-lg border bg-white p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Kết quả xác thực (HTTP 200):</span>
                <Badge variant="outline" className="border-emerald-500 text-emerald-600">Thành công</Badge>
              </div>
              <pre className="overflow-x-auto rounded bg-slate-900 p-3 text-xs text-emerald-400">
                {JSON.stringify(profileData, null, 2)}
              </pre>
            </div>
          )}

          {errorStatus && (
            <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              Lỗi: {errorStatus}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}