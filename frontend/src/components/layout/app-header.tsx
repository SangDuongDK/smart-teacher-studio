'use client';

import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, User as UserIcon } from 'lucide-react';

export function AppHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-500">Hệ sinh thái Smart Education</span>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-800">{user.fullName}</p>
              <Badge variant="secondary" className="text-[10px] font-normal">
                {user.role}
              </Badge>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600">
              <UserIcon className="h-5 w-5" />
            </div>
          </div>
        )}
        <Button variant="ghost" size="icon" onClick={logout} title="Đăng xuất">
          <LogOut className="h-5 w-5 text-slate-500 hover:text-destructive" />
        </Button>
      </div>
    </header>
  );
}