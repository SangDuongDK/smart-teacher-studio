'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Database, Search, Loader2, CheckSquare, Square } from 'lucide-react';
import { QuestionItem } from '@/types/question';
import { questionService } from '@/services/question.service';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsertContent: (htmlContent: string) => void;
}

export default function SelectQuestionBankModal({
  open,
  onOpenChange,
  onInsertContent,
}: Props) {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [keyword, setKeyword] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Tải danh sách câu hỏi từ CSDL
  const fetchQuestions = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: Record<string, string> = {};
      if (keyword.trim()) params.q = keyword.trim();
      if (filterType !== 'ALL') params.type = filterType;

      const res = await questionService.getQuestions(params);
      const rawList: QuestionItem[] = res.data || [];
      // Khai báo kiểu QuestionItem thay cho any để hết lỗi ESLint
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
      setQuestions(mapped);
    } catch (err: unknown) {
      console.error('Lỗi tải ngân hàng câu hỏi:', err);
    } finally {
      setIsLoading(false);
    }
  }, [keyword, filterType]);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void fetchQuestions();
    }
  }, [open, fetchQuestions]);

  // Xử lý đóng modal và reset selection
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedIds([]);
    }
    onOpenChange(isOpen);
  };

  // Chọn / bỏ chọn 1 câu hỏi
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Chọn tất cả / Bỏ chọn tất cả
  const toggleSelectAll = () => {
    if (selectedIds.length === questions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(questions.map((q) => q.id || '').filter(Boolean));
    }
  };

  // Chuyển các câu hỏi đã chọn thành mã HTML và chèn vào Tiptap
  const handleInsert = () => {
    const selectedQuestions = questions.filter((q) => q.id && selectedIds.includes(q.id));
    if (selectedQuestions.length === 0) return;

    let html = `<h3>📝 Bài tập củng cố từ Ngân hàng câu hỏi</h3><ol>`;

    selectedQuestions.forEach((ex) => {
      html += `<li><strong>${ex.content}</strong>`;

      // Dạng trắc nghiệm
      if (ex.type === 'MULTIPLE_CHOICE' && ex.options?.options) {
        html += `<ul>${ex.options.options
          .map((opt, i) => `<li>${String.fromCharCode(65 + i)}.${opt}</li>`)
          .join('')}</ul>`;
      }

      // Dạng sắp xếp câu
      if (ex.type === 'REORDER_SENTENCE' && ex.options?.shuffledWords) {
        html += `<p><em>Từ gợi ý: [ ${ex.options.shuffledWords.join(' / ')} ]</em></p>`;
      }

      // Dạng nối từ
      if (ex.type === 'MATCHING' && ex.options?.pairs) {
        html += `<table border="1"><thead><tr><th>Cột A</th><th>Cột B</th></tr></thead><tbody>`;
        ex.options.pairs.forEach((p: { left: string; right: string }) => {
          html += `<tr><td>${p.left}</td><td>${p.right}</td></tr>`;
        });
        html += `</tbody></table>`;
      }

      // Đáp án & Giải thích
      html += `<p><em>👉 <strong>Đáp án:</strong> ${String(ex.correctAnswer)}</em></p>`;
      if (ex.explanation) {
        html += `<p><em>💡 <strong>Giải thích:</strong> ${ex.explanation}</em></p>`;
      }

      html += `</li>`;
    });

    html += `</ol><p></p>`;

    onInsertContent(html);
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col bg-white">
        <DialogHeader className="pb-2 border-b">
          <DialogTitle className="flex items-center gap-2 text-slate-800 text-base">
            <Database className="w-5 h-5 text-blue-600" />
            Chọn câu hỏi từ Ngân hàng câu hỏi
          </DialogTitle>
        </DialogHeader>

        {/* Thanh tìm kiếm & lọc */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3 border-b bg-slate-50 p-3 rounded-lg text-xs">
          <div className="sm:col-span-2 relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm nội dung câu hỏi..."
              className="pl-8 h-8 text-xs bg-white"
            />
          </div>

          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full h-8 px-2 rounded-md border border-slate-200 bg-white text-xs text-slate-700 outline-none"
            >
              <option value="ALL">Tất cả dạng bài</option>
              <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
              <option value="FILL_IN_BLANK">Điền từ</option>
              <option value="MATCHING">Nối từ</option>
              <option value="REORDER_SENTENCE">Sắp xếp câu</option>
              <option value="TRUE_FALSE">Đúng / Sai</option>
            </select>
          </div>
        </div>

        {/* Danh sách câu hỏi có checkbox */}
        <div className="flex-1 overflow-y-auto py-2 space-y-2 pr-1">
          {isLoading ? (
            <div className="py-12 flex justify-center text-slate-500 text-xs">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải câu hỏi...
            </div>
          ) : questions.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Không tìm thấy câu hỏi phù hợp trong ngân hàng.
            </div>
          ) : (
            questions.map((q, idx) => {
              const isChecked = q.id ? selectedIds.includes(q.id) : false;
              return (
                <div
                  key={q.id || idx}
                  onClick={() => q.id && toggleSelect(q.id)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-colors flex items-start gap-3 ${
                    isChecked
                      ? 'border-blue-500 bg-blue-50/40'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <button type="button" className="mt-0.5 text-blue-600">
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">
                        {q.type}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] text-blue-600">
                        {q.difficulty}
                      </Badge>
                    </div>
                    <p className="font-medium text-slate-800">{q.content}</p>
                    <p className="text-slate-500 text-[11px]">
                      👉 Đáp án: <span className="font-semibold">{String(exCorrectAnswer(q.correctAnswer))}</span>
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="pt-2 border-t flex flex-row items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleSelectAll}
            className="text-xs text-slate-600"
          >
            {selectedIds.length === questions.length && questions.length > 0
              ? 'Bỏ chọn tất cả'
              : 'Chọn tất cả'}
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleOpenChange(false)}>
              Đóng
            </Button>
            <Button
              size="sm"
              disabled={selectedIds.length === 0}
              onClick={handleInsert}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
            >
              Chèn {selectedIds.length > 0 ? `(${selectedIds.length})` : ''} câu vào bài
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hàm phụ trợ hiển thị đáp án an toàn
function exCorrectAnswer(ans: unknown): string {
  if (ans === null || ans === undefined) return '';
  if (typeof ans === 'object') return JSON.stringify(ans);
  return String(ans);
}