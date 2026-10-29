'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { 
  BookOpen, 
  LayoutDashboard, 
  /*FileCheck2, 
  Users, 
  FolderArchive,*/ 
  Sparkles,
  GraduationCap,
  HelpCircle,
  Award
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    {
      title: 'Bảng điều khiển',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['TEACHER', 'REVIEWER', 'ADMIN'],
    },
    {
      title: 'Quản lý bài học',
      href: '/lessons',
      icon: BookOpen,
      roles: ['TEACHER', 'ADMIN'],
    },
    {
      title: 'Ngân hàng câu hỏi', 
      href: '/questions',
      icon: HelpCircle,
      roles: ['TEACHER', 'ADMIN'],
    },
    {
      title: 'Quản lý đề thi', 
      href: '/exams',
      icon: Award,
      roles: ['TEACHER', 'ADMIN'],
    },
    /*{
      title: 'Kho học liệu số',
      href: '/resources',
      icon: FolderArchive,
      roles: ['TEACHER', 'REVIEWER', 'ADMIN'],
    },
    {
      title: 'Duyệt học liệu',
      href: '/reviews',
      icon: FileCheck2,
      roles: ['REVIEWER', 'ADMIN'],
    },
    {
      title: 'Quản trị hệ thống',
      href: '/admin',
      icon: Users,
      roles: ['ADMIN'],
    },*/
  ];

  const filteredNav = navItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  return (
    <aside className="w-64 border-r bg-white min-h-screen flex flex-col">
      <div className="flex h-16 items-center gap-2 px-6 border-b">
        <GraduationCap className="h-6 w-6 text-blue-600" />
        <span className="font-bold text-lg text-slate-800">Smart Studio</span>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {filteredNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      {/* Box hiển thị AI Status */}
        <div className="p-4 m-4 rounded-xl bg-linear-to-br from-blue-50 to-indigo-50 border border-blue-100">        <div className="flex items-center gap-2 text-blue-700 font-medium text-xs mb-1">
          <Sparkles className="h-4 w-4" />
          <span>Gemini AI Connected</span>
        </div>
        <p className="text-[11px] text-slate-500">Sẵn sàng hỗ trợ soạn học liệu K-9 chuẩn hóa.</p>
      </div>
    </aside>
  );
}