'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExerciseType, DifficultyLevel, GenerateExerciseInput } from '@/types/question';
import { Sparkles, Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (params: GenerateExerciseInput) => Promise<void>;
  isLoading: boolean;
  defaultTopic?: string;
  defaultGrade?: number;
}

const EXERCISE_TYPES: { id: ExerciseType; label: string }[] = [
  { id: 'MULTIPLE_CHOICE', label: 'Trắc nghiệm (4 lựa chọn)' },
  { id: 'FILL_IN_BLANK', label: 'Điền vào chỗ trống' },
  { id: 'MATCHING', label: 'Nối từ / Cặp câu' },
  { id: 'REORDER_SENTENCE', label: 'Sắp xếp câu' },
  { id: 'TRUE_FALSE', label: 'Đúng / Sai (True / False)' },
];

export default function AiExerciseModal({
  open,
  onOpenChange,
  onGenerate,
  isLoading,
  defaultTopic = 'Unit 2: My New School',
  defaultGrade = 6,
}: Props) {
  const [grade, setGrade] = useState<number>(defaultGrade);
  const [topic, setTopic] = useState<string>(defaultTopic);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('MEDIUM');
  const [totalCount, setTotalCount] = useState<number>(5);
  const [selectedTypes, setSelectedTypes] = useState<ExerciseType[]>([
    'MULTIPLE_CHOICE',
    'FILL_IN_BLANK',
  ]);

  const toggleType = (t: ExerciseType) => {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((item) => item !== t) : [...prev, t]
    );
  };

  const handleStart = () => {
    if (!topic.trim()) {
      alert('Vui lòng nhập chủ đề bài tập');
      return;
    }
    if (selectedTypes.length === 0) {
      alert('Vui lòng chọn ít nhất 1 dạng bài');
      return;
    }
    onGenerate({
      grade,
      topic,
      difficulty,
      totalCount,
      types: selectedTypes,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-600 font-bold">
            <Sparkles className="w-5 h-5 text-purple-600" /> AI Tạo Bài Tập Tiếng Anh K-9
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2 text-sm">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs mb-1 block">Khối lớp</Label>
              <select
                value={grade}
                onChange={(e) => setGrade(Number(e.target.value))}
                className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs outline-none focus:border-blue-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => (
                  <option key={g} value={g}>
                    Lớp {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs mb-1 block">Độ khó</Label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs outline-none focus:border-blue-500"
              >
                <option value="EASY">Dễ</option>
                <option value="MEDIUM">Trung bình</option>
                <option value="HARD">Nâng cao</option>
              </select>
            </div>

            <div>
              <Label className="text-xs mb-1 block">Số lượng câu</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={totalCount}
                onChange={(e) => setTotalCount(Number(e.target.value))}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs mb-1 block">Chủ đề bài học (Topic / Unit)</Label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="VD: Unit 2: My House - Vocabulary"
              className="text-xs"
            />
          </div>

          <div>
            <Label className="text-xs mb-2 block">Dạng bài tập:</Label>
            <div className="grid grid-cols-2 gap-2">
              {EXERCISE_TYPES.map((t) => {
                const checked = selectedTypes.includes(t.id);
                return (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => toggleType(t.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-colors ${
                      checked
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-medium'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <input type="checkbox" checked={checked} readOnly className="rounded text-blue-600 pointer-events-none" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Đóng
          </Button>
          <Button onClick={handleStart} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang tạo bài tập...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" /> Bắt đầu tạo
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}