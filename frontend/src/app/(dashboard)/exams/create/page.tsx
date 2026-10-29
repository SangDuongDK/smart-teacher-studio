'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  PRIMARY_15MIN_PRESET,
  PRIMARY_MIDTERM_PRESET, 
  SECONDARY_15MIN_PRESET,
  SECONDARY_MIDTERM_PRESET, 
  ExamMatrixBlueprint 
} from '@/types/exam';
import { examService } from '@/services/exam.service';
import { Sparkles, ArrowLeft, Loader2, BookOpen } from 'lucide-react';

export default function CreateExamPage() {
  const router = useRouter();
  const [grade, setGrade] = useState<number>(6);
  const [examType, setExamType] = useState<string>('MID_TERM');
  const [title, setTitle] = useState<string>('Đề kiểm tra Giữa học kỳ I - Tiếng Anh 6');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const getPreset = (g: number, type: string): ExamMatrixBlueprint => {
    const isPrimary = g <= 5;
    if (type === '15_MIN') {
      return isPrimary ? PRIMARY_15MIN_PRESET : SECONDARY_15MIN_PRESET;
    }
    return isPrimary ? PRIMARY_MIDTERM_PRESET : SECONDARY_MIDTERM_PRESET;
  };

  const [blueprint, setBlueprint] = useState<ExamMatrixBlueprint>(getPreset(6, 'MID_TERM'));

  const handleGradeChange = (newGrade: number) => {
    setGrade(newGrade);
    updateTitleAndPreset(newGrade, examType);
  };

  const handleTypeChange = (newType: string) => {
    setExamType(newType);
    updateTitleAndPreset(grade, newType);
  };

  const updateTitleAndPreset = (g: number, t: string) => {
    const typeLabel = t === '15_MIN' ? '15 Phút' : t === 'FINAL_TERM' ? 'Cuối học kỳ I' : 'Giữa học kỳ I';
    setTitle(`Đề kiểm tra ${typeLabel} - Tiếng Anh ${g}`);
    const preset = getPreset(g, t);
    setBlueprint({ ...preset, examType: t as '15_MIN' | 'MID_TERM' | 'FINAL_TERM' | 'REVIEW' });
  };

  const handleCreateExam = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        title,
        grade,
        durationMinutes: blueprint.durationMinutes,
        matrixBlueprint: blueprint,
      };

      const res = await examService.generateFromMatrix(payload);
      const summary = res.summary;
      
      let message = 'Tạo đề kiểm tra thành công!';
      if (summary) {
        message += `\n• Lấy từ Ngân hàng câu hỏi: ${summary.bankCount} câu\n• AI tự động tạo bù: ${summary.aiGeneratedCount} câu`;
      }
      alert(message);

      router.push(`/exams/${res.data?.id || ''}`);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string | string[] } }; message?: string };
      const backendMessage = errorObj.response?.data?.message;
      const msg = Array.isArray(backendMessage) ? backendMessage.join('\n') : backendMessage || errorObj.message || 'Lỗi khi tạo đề kiểm tra';
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Khởi tạo Đề kiểm tra theo Ma trận GDPT 2018</h1>
          <p className="text-xs text-slate-500">
            Hệ thống ưu tiên vét cạn câu hỏi trong Ngân hàng trước; khi hết câu mới tự động gọi AI sinh bù.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="font-semibold block mb-1 text-slate-700">Khối lớp (Grade)</label>
            <select
              value={grade}
              onChange={(e) => handleGradeChange(Number(e.target.value))}
              className="w-full h-9 border border-slate-300 rounded-md px-2.5 bg-white text-slate-800 outline-none focus:border-blue-500"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => (
                <option key={g} value={g}>
                  Lớp {g} {g <= 5 ? '(Cấp Tiểu học - TT 27)' : '(Cấp THCS - TT 22)'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold block mb-1 text-slate-700">Hình thức kiểm tra</label>
            <select
              value={examType}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full h-9 border border-slate-300 rounded-md px-2.5 bg-white text-slate-800 outline-none focus:border-blue-500"
            >
              <option value="15_MIN">Kiểm tra 15 phút</option>
              <option value="MID_TERM">Kiểm tra Giữa kỳ</option>
              <option value="FINAL_TERM">Kiểm tra Cuối kỳ</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="font-semibold block mb-1 text-slate-700">Tiêu đề đề thi</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            Ma trận phân bổ câu hỏi: {grade <= 5 ? 'Tiểu học (TT 27/2020)' : 'THCS (TT 22/2021)'}
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="secondary" className="text-xs">Thời lượng: {blueprint.durationMinutes} phút</Badge>
            <Badge variant="outline" className="text-xs text-blue-600">Tổng: {blueprint.totalQuestions} câu / {blueprint.totalScore} điểm</Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {blueprint.sections.map((sec) => (
            <div key={sec.sectionId} className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-800">
                <span>{sec.name}</span>
                <span className="text-slate-500">{sec.questionCount} câu</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                {sec.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="bg-white p-2 border border-slate-200 rounded flex justify-between items-center">
                    <div className="flex gap-1.5 items-center">
                      <Badge variant="secondary" className="text-[10px]">{item.type}</Badge>
                      <Badge variant="outline" className="text-[10px] text-blue-600">{item.difficulty}</Badge>
                    </div>
                    <span className="font-medium text-slate-700">{item.count} câu ({item.point} đ/câu)</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <Button
            onClick={handleCreateExam}
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang bốc câu hỏi từ Ngân hàng & AI sinh bù...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" /> Bắt đầu tạo đề kiểm tra
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}