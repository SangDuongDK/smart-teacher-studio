'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Award, 
  Plus, 
  Search, 
  Clock, 
  FileText, 
  Trash2, 
  Eye, 
  Loader2,
  Calendar
} from 'lucide-react';
import { examService } from '@/services/exam.service';

interface ExamItem {
  id: string;
  title: string;
  type: string;
  durationMinutes: number;
  totalScore: number;
  createdAt: string;
  grade?: { id: string; name: string };
  _count?: { examQuestions: number };
}

export default function ExamsPage() {
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [keyword, setKeyword] = useState<string>('');

  const loadExams = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await examService.getExams({ q: keyword.trim() || undefined });
      setExams(res.data || []);
    } catch (err: unknown) {
      console.error('Lỗi tải danh sách đề thi:', err);
    } finally {
      setIsLoading(false);
    }
  }, [keyword]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadExams();
  }, [loadExams]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa đề thi: "${title}"?`)) return;
    try {
      await examService.deleteExam(id);
      setExams((prev) => prev.filter((e) => e.id !== id));
      alert('Đã xóa đề thi thành công!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Xóa thất bại';
      alert(msg);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý Đề kiểm tra (K-9)</h1>
          <p className="text-xs text-slate-500">
            Kho lưu trữ đề thi định kỳ bám sát ma trận đánh giá chuẩn GDPT 2018.
          </p>
        </div>

        <Link href="/exams/create">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-xs">
            <Plus className="w-4 h-4 mr-1.5" /> Tạo đề thi theo Ma trận
          </Button>
        </Link>
      </div>

      {/* Toolbar tìm kiếm */}
      <Card className="border-slate-200">
        <CardContent className="p-3">
          <div className="relative max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm kiếm theo tiêu đề đề thi..."
              className="pl-8 h-8 text-xs bg-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Danh sách đề thi */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Award className="w-4 h-4 text-blue-600" />
            Danh sách đề đã tạo ({exams.length})
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => void loadExams()} className="text-xs h-8">
            Làm mới
          </Button>
        </CardHeader>

        <CardContent className="pt-4">
          {isLoading ? (
            <div className="py-12 flex justify-center text-slate-500 text-xs">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải dữ liệu đề thi...
            </div>
          ) : exams.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs space-y-2">
              <p>Chưa có đề kiểm tra nào trong hệ thống.</p>
              <Link href="/exams/create">
                <Button variant="outline" size="sm" className="text-xs text-blue-600 border-blue-200">
                  Khởi tạo đề đầu tiên
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-xs transition-all space-y-3"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">
                          {exam.grade?.name || 'K-9'}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-200">
                          {exam.type}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-slate-800 text-sm leading-snug">
                        {exam.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <Link href={`/exams/${exam.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600" title="Xem chi tiết">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void handleDelete(exam.id, exam.title)}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600"
                        title="Xóa đề"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {exam.durationMinutes} phút
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" /> {exam._count?.examQuestions ?? 0} câu
                    </span>
                    <span className="flex items-center gap-1 ml-auto text-[11px]">
                      <Calendar className="w-3 h-3" /> {new Date(exam.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}