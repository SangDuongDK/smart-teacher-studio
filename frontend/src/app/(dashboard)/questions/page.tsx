'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Sparkles, 
  Save, 
  Database, 
  Loader2, 
  Filter, 
  Search, 
  RotateCcw, 
  X 
} from 'lucide-react';
import { QuestionItem, GenerateExerciseInput } from '@/types/question';
import { questionService } from '@/services/question.service';
import AiExerciseModal from '@/components/questions/AiExerciseModal';
import ExerciseCard from '@/components/questions/ExerciseCard';

export default function QuestionsPage() {
  const [bankQuestions, setBankQuestions] = useState<QuestionItem[]>([]);
  const [aiExercises, setAiExercises] = useState<QuestionItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingBank, setIsLoadingBank] = useState(true);

  // States phục vụ bộ lọc
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');
  const [isFilterVisible, setIsFilterVisible] = useState<boolean>(true);

  // Tải danh sách câu hỏi từ CSDL có truyền tham số lọc xuống Backend
  const loadBank = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (searchKeyword.trim()) params.q = searchKeyword.trim();
      if (selectedType !== 'ALL') params.type = selectedType;
      if (selectedDifficulty !== 'ALL') params.difficulty = selectedDifficulty;

      const res = await questionService.getQuestions(params);
      const rawList: QuestionItem[] = res.data || [];
      const mapped: QuestionItem[] = rawList.map((item: QuestionItem) => ({
        id: item.id,
        type: item.type,
        difficulty: item.difficulty,
        content: item.content,
        options: item.options || {},
        correctAnswer: item.correctAnswer,
        explanation: item.explanation,
        tags: item.tags,
      }));
      setBankQuestions(mapped);
    } catch (err: unknown) {
      console.error('Lỗi khi tải kho câu hỏi:', err);
    } finally {
      setIsLoadingBank(false);
    }
  }, [searchKeyword, selectedType, selectedDifficulty]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadBank();
  }, [loadBank]);

  // Nút làm mới danh sách
  const handleRefresh = () => {
    setIsLoadingBank(true);
    void loadBank();
  };

  // Đặt lại toàn bộ bộ lọc về mặc định
  const handleResetFilter = () => {
    setSearchKeyword('');
    setSelectedType('ALL');
    setSelectedDifficulty('ALL');
  };

  // Kích hoạt AI tạo bài tập
  const handleGenerate = async (params: GenerateExerciseInput) => {
    try {
      setIsGenerating(true);
      const data = await questionService.generateExercises(params);
      setAiExercises(data);
      setIsModalOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi sinh câu hỏi';
      alert(message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Lưu hàng loạt vào CSDL
  const handleSaveToBank = async () => {
    if (aiExercises.length === 0) return;
    try {
      setIsSaving(true);
      await questionService.saveBatch(aiExercises);
      alert(`Đã lưu thành công ${aiExercises.length} câu hỏi vào ngân hàng!`);
      setAiExercises([]);
      handleRefresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi khi lưu vào ngân hàng';
      alert(message);
    } finally {
      setIsSaving(false);
    }
  };

  // Xóa câu hỏi đã lưu trong CSDL Backend
  const handleDeleteBankQuestion = async (id?: string) => {
    if (!id) return;

    const confirmed = confirm('Bạn có chắc chắn muốn xóa câu hỏi này khỏi ngân hàng?');
    if (!confirmed) return;

    try {
      await questionService.deleteQuestion(id);
      // Cập nhật State để ẩn câu hỏi ngay trên giao diện mà không cần reload
      setBankQuestions((prev) => prev.filter((item) => item.id !== id));
      alert('Đã xóa câu hỏi thành công!');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Xóa câu hỏi thất bại';
      alert(message);
    }
  };
  // Xóa câu hỏi khỏi danh sách tạm do AI vừa tạo
  const handleDeleteAiExercise = (index: number) => {
    setAiExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const hasActiveFilters = searchKeyword.trim() !== '' || selectedType !== 'ALL' || selectedDifficulty !== 'ALL';

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Ngân hàng câu hỏi & Bài tập (K-9)</h1>
          <p className="text-xs text-slate-500">
            Kho bài tập chuẩn hóa GDPT 2018 tích hợp sinh bài tập thông minh từ Gemini AI.
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Sparkles className="w-4 h-4 mr-2" /> Tạo bài tập bằng AI
        </Button>
      </div>

      {/* Danh sách câu hỏi vừa sinh từ AI */}
      {aiExercises.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/20">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-bold text-blue-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Câu hỏi vừa sinh bằng AI ({aiExercises.length} câu)
            </CardTitle>
            <Button
              onClick={handleSaveToBank}
              disabled={isSaving}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              {isSaving ? 'Đang lưu...' : 'Lưu tất cả vào ngân hàng'}
            </Button>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3">
            {aiExercises.map((ex, i) => (
              <ExerciseCard
                key={i}
                exercise={ex}
                index={i}
                onDelete={handleDeleteAiExercise}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Danh sách câu hỏi có sẵn trong kho DB */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-2 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Database className="w-4 h-4 text-slate-500" />
            Câu hỏi trong ngân hàng ({bankQuestions.length})
          </CardTitle>

          <div className="flex items-center gap-2">
            {/* Nút bật/tắt thanh lọc */}
            <Button
              variant={isFilterVisible ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setIsFilterVisible(!isFilterVisible)}
              className="text-xs h-8 gap-1.5"
            >
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              <span>Bộ lọc</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              )}
            </Button>

            {/* Nút làm mới */}
            <Button variant="outline" size="sm" onClick={handleRefresh} className="text-xs h-8">
              Làm mới
            </Button>
          </div>
        </CardHeader>

        {/* THANH BỘ LỌC (FILTER TOOLBAR) */}
        {isFilterVisible && (
          <div className="p-3.5 bg-slate-50/70 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            {/* 1. Tìm kiếm theo từ khóa */}
            <div className="sm:col-span-5 relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm nội dung câu hỏi..."
                className="pl-8 h-8 text-xs bg-white border-slate-200"
              />
              {searchKeyword && (
                <button
                  onClick={() => setSearchKeyword('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* 2. Lọc theo Dạng câu hỏi */}
            <div className="sm:col-span-3">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full h-8 px-2.5 rounded-md border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:border-blue-500"
              >
                <option value="ALL">Tất cả dạng bài</option>
                <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
                <option value="FILL_IN_BLANK">Điền từ</option>
                <option value="MATCHING">Nối từ</option>
                <option value="REORDER_SENTENCE">Sắp xếp câu</option>
                <option value="TRUE_FALSE">Đúng / Sai</option>
              </select>
            </div>

            {/* 3. Lọc theo Độ khó */}
            <div className="sm:col-span-3">
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full h-8 px-2.5 rounded-md border border-slate-200 bg-white text-xs text-slate-700 outline-none focus:border-blue-500"
              >
                <option value="ALL">Tất cả độ khó</option>
                <option value="EASY">Dễ (EASY)</option>
                <option value="MEDIUM">Trung bình (MEDIUM)</option>
                <option value="HARD">Nâng cao (HARD)</option>
              </select>
            </div>

            {/* 4. Nút đặt lại bộ lọc */}
            <div className="sm:col-span-1 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilter}
                disabled={!hasActiveFilters}
                className="h-8 px-2 text-slate-500 hover:text-rose-600 disabled:opacity-40"
                title="Đặt lại bộ lọc"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}

        <CardContent className="pt-4">
          {isLoadingBank ? (
            <div className="py-12 flex justify-center text-slate-500 text-xs">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải dữ liệu...
            </div>
          ) : bankQuestions.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs space-y-1">
              {hasActiveFilters ? (
                <>
                  <p>Không tìm thấy câu hỏi nào phù hợp với bộ lọc hiện tại.</p>
                  <Button variant="link" size="sm" onClick={handleResetFilter} className="text-blue-600 text-xs p-0 h-auto">
                    Xóa bộ lọc để xem tất cả
                  </Button>
                </>
              ) : (
                <p>
                  Chưa có câu hỏi nào. Nhấn <b>&quot;Tạo bài tập bằng AI&quot;</b> để bắt đầu sinh học liệu!
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {bankQuestions.map((q, i) => (
                <ExerciseCard
                  key={q.id || i}
                  exercise={q}
                  index={i}
                  onDelete={() => void handleDeleteBankQuestion(q.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AiExerciseModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onGenerate={handleGenerate}
        isLoading={isGenerating}
      />
    </div>
  );
}