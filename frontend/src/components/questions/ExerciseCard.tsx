'use client';

import React from 'react';
import { QuestionItem } from '@/types/question';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, CheckCircle2, Trash2 } from 'lucide-react';

interface Props {
  exercise: QuestionItem;
  index: number;
  onDelete?: (index: number) => void;
}

export default function ExerciseCard({ exercise, index, onDelete }: Props) {
  const options = exercise.options || {};

  return (
    <Card className="hover:border-blue-300 transition-all border-slate-200 shadow-xs">
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
              {index + 1}
            </span>
            <Badge variant="secondary" className="text-[11px] font-semibold">
              {exercise.type}
            </Badge>
            <Badge variant="outline" className="text-[11px] text-blue-600 border-blue-200 bg-blue-50/50">
              {exercise.difficulty}
            </Badge>
          </div>

          {onDelete && (
            <button
              onClick={() => onDelete(index)}
              className="text-slate-400 hover:text-rose-500 p-1 rounded"
              title="Xóa câu hỏi này"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <p className="font-semibold text-slate-800 text-sm leading-relaxed">{exercise.content}</p>

        <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-2 border border-slate-100">
          {/* Trắc nghiệm */}
          {exercise.type === 'MULTIPLE_CHOICE' && options.options && (
            <div className="grid grid-cols-2 gap-2">
              {options.options.map((opt: string, i: number) => {
                const isCorrect = String(exercise.correctAnswer).trim() === opt.trim();
                return (
                  <div
                    key={i}
                    className={`p-2 rounded border ${
                      isCorrect
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-800 font-semibold'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="font-bold mr-1.5">{String.fromCharCode(65 + i)}.</span>
                    {opt}
                  </div>
                );
              })}
            </div>
          )}

          {/* Sắp xếp câu */}
          {exercise.type === 'REORDER_SENTENCE' && options.shuffledWords && (
            <div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {options.shuffledWords.map((w: string, i: number) => (
                  <span key={i} className="px-2 py-0.5 bg-white border border-slate-300 rounded text-xs font-mono">
                    {w}
                  </span>
                ))}
              </div>
              <p className="text-emerald-700 font-medium">Đáp án chuẩn: {String(exercise.correctAnswer)}</p>
            </div>
          )}

          {/* Nối từ */}
          {exercise.type === 'MATCHING' && options.pairs && (
            <div className="space-y-1">
              {options.pairs.map((p: { left: string; right: string }, i: number) => (
                <div key={i} className="flex justify-between bg-white px-2.5 py-1.5 border rounded">
                  <span className="text-slate-800">{p.left}</span>
                  <span className="text-blue-600 font-medium">↔ {p.right}</span>
                </div>
            ))}
            </div>
          )}

          {/* Điền từ & True/False */}
          {(exercise.type === 'FILL_IN_BLANK' || exercise.type === 'TRUE_FALSE') && (
            <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Đáp án: {String(exercise.correctAnswer)}</span>
            </div>
          )}
        </div>

        {exercise.explanation && (
          <div className="flex items-start gap-1.5 text-xs text-slate-600 border-t pt-2">
            <BookOpen className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
            <p>
              <span className="font-semibold text-slate-700">Giải thích:</span> {exercise.explanation}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}