'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  BookOpen, 
  Search, 
  Loader2, 
  Clock, 
  Calendar, 
  Edit3, 
  Trash2, 
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface LessonItem {
  id: string;
  title: string;
  primarySkill: string;
  durationMinutes: number;
  status: 'DRAFT' | 'PUBLISHED' | string;
  updatedAt: string;
  grade?: { id: string; name: string };
  topic?: { id: string; name: string; unitName?: string };
}

export default function LessonsPage() {
  const router = useRouter();

  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [creating, setCreating] = useState<boolean>(false);
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // 1. Tải danh sách bài học
  const fetchLessons = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { limit: 50 };
      if (searchKeyword.trim()) params.search = searchKeyword.trim();

      const res = await apiClient.get('/lessons', { params });
      setLessons(res.data?.items || []);
    } catch (err: unknown) {
      console.error('Lỗi khi tải danh sách bài học:', err);
    } finally {
      setLoading(false);
    }
  }, [searchKeyword]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchLessons();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchLessons]);

  // 2. Tạo bài học mới
  const handleCreateNewLesson = async () => {
    setCreating(true);
    try {
      const res = await apiClient.post('/lessons', {
        title: 'Bài giảng mới',
        skill: 'READING',
        duration: 45,
        difficulty: 'BEGINNER',
      });
      const newLessonId = res.data?.id;
      if (newLessonId) {
        router.push(`/lessons/${newLessonId}/edit`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi không xác định khi tạo bài';
      alert('Không thể tạo bài học: ' + msg);
    } finally {
      setCreating(false);
    }
  };

  // 3. Xóa bài học (Gọi API DELETE /api/lessons/:id)
  const handleDeleteLesson = async (id: string, title: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa bài học "${title}" không?`)) return;

    try {
      await apiClient.delete(`/lessons/${id}`);
      // Cập nhật State trực tiếp trên giao diện không cần reload lại trang
      setLessons((prev) => prev.filter((item) => item.id !== id));
      alert('Đã xóa bài học thành công!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi xóa bài học';
      alert('Không thể xóa bài học: ' + msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tiêu đề & Nút Tạo mới */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Quản lý bài học
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Danh mục kế hoạch bài dạy Tiếng Anh K-9 biên soạn theo chương trình GDPT 2018.
          </p>
        </div>
        <Button 
          onClick={handleCreateNewLesson} 
          disabled={creating} 
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-xs font-medium text-xs h-9"
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {creating ? 'Đang khởi tạo...' : 'Tạo bài học mới'}
        </Button>
      </div>

      {/* Thanh tìm kiếm */}
      <div className="flex items-center gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input 
            placeholder="Tìm kiếm bài học theo tiêu đề..." 
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="pl-8 h-8 text-xs bg-white border-slate-200" 
          />
        </div>
        {searchKeyword && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSearchKeyword('')} 
            className="h-8 px-2 text-xs text-slate-500 hover:text-slate-800"
            title="Xóa bộ lọc"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Danh sách bài học */}
      {loading ? (
        <div className="py-20 flex flex-col justify-center items-center text-slate-500 text-xs space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span>Đang nạp danh sách bài học từ máy chủ...</span>
        </div>
      ) : lessons.length === 0 ? (
        <div className="flex min-h-75 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <BookOpen className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-slate-800">
            {searchKeyword ? 'Không tìm thấy bài học phù hợp' : 'Chưa có bài học nào được tạo'}
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
            {searchKeyword 
              ? 'Thử thay đổi từ khóa tìm kiếm hoặc bấm nút làm mới.' 
              : 'Bấm nút "Tạo bài học mới" ở góc phải để bắt đầu soạn giáo án tích hợp trợ lý AI.'}
          </p>
          {!searchKeyword && (
            <Button 
              onClick={handleCreateNewLesson} 
              size="sm" 
              className="mt-4 text-xs bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Bắt đầu soạn bài đầu tiên
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lessons.map((lesson) => {
            const isPublished = lesson.status === 'PUBLISHED';
            return (
              <Card 
                key={lesson.id} 
                className="hover:border-blue-300 transition-all bg-white border-slate-200 shadow-xs hover:shadow-sm"
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {lesson.grade?.name || 'K-9'}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-200 bg-blue-50/50 px-1.5 py-0">
                        {lesson.primarySkill}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] px-1.5 py-0 font-medium ${
                          isPublished 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {isPublished ? 'Đã xuất bản' : 'Bản nháp'}
                      </Badge>
                    </div>

                    {/* Nhóm nút Chỉnh sửa & Xóa bài học */}
                    <div className="flex items-center gap-1">
                      <Link href={`/lessons/${lesson.id}/edit`}>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50" 
                          title="Mở trình soạn giáo án"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                        className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50" 
                        title="Xóa bài học"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm leading-snug line-clamp-1" title={lesson.title}>
                      {lesson.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {lesson.topic?.name ? `Chủ đề: ${lesson.topic.name}` : 'Chưa gắn chủ đề'}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-2.5 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" /> {lesson.durationMinutes} phút
                    </span>
                    <span className="flex items-center gap-1 ml-auto text-[10px] text-slate-400">
                      <Calendar className="w-3 h-3" /> {new Date(lesson.updatedAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}