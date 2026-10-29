'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  Printer, 
  Loader2, 
  CheckCircle2, 
  Sparkles, 
  RefreshCw, 
  BookmarkCheck, 
  Database,
  Layers,
  Save,
  Trash2,
  AlertTriangle,
  Edit3
} from 'lucide-react';
import { examService } from '@/services/exam.service';
import { ExamMatrixBlueprint, ExamSectionBlueprint } from '@/types/exam';

interface QuestionDetail {
  id: string;
  type: string;
  difficulty: string;
  content: string;
  tags?: string[];
  options?: {
    options?: string[];
    shuffledWords?: string[];
    pairs?: { left: string; right: string }[];
  };
  correctAnswer: unknown;
  explanation?: string;
}

interface ExamQuestionItem {
  id: string;
  questionOrder: number;
  pointWeight: number | string;
  question: QuestionDetail;
}

interface ExamDetailData {
  id: string;
  title: string;
  type: string;
  durationMinutes: number;
  totalScore: number | string;
  grade?: { name: string };
  matrixBlueprint?: ExamMatrixBlueprint & { isDraft?: boolean };
  examQuestions: ExamQuestionItem[];
  stats?: { total: number; bankCount: number; aiCount: number };
}

function cleanQuestionContent(raw: string): string {
  if (!raw) return '';
  let cleaned = raw.normalize('NFC').trim();

  const patterns = [
    /^(choose|select|pick)\s+the\s+correct\s+(word|words|answer|answers|option|options|preposition|form|tense|letter)(\s+to\s+complete\s+the\s+sentence)?:\s*/i,
    /^(choose|select)\s+the\s+best\s+(answer|option|word):\s*/i,
    /^(complete|fill\s+in)\s+the\s+(sentence|sentences|word|words|blank|blanks|gap|gaps):\s*/i,
    /^(reorder|rearrange)\s+the\s+(words|words\s+to\s+make\s+a\s+sentence):\s*/i,
    /^(match\s+the\s+words|match\s+each\s+item):\s*/i,
  ];

  for (const p of patterns) {
    cleaned = cleaned.replace(p, '');
  }

  cleaned = cleaned.trim();
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  return cleaned;
}

function getInstructionForType(type: string): string {
  switch (type) {
    case 'MULTIPLE_CHOICE':
      return 'Mark the letter A, B, C, or D on your answer sheet to indicate the correct answer to each of the following questions.';
    case 'FILL_IN_BLANK':
      return 'Write ONE suitable word to complete each of the following sentences / words:';
    case 'REORDER_SENTENCE':
      return 'Rearrange the following words or phrases to make complete and meaningful sentences:';
    case 'MATCHING':
      return 'Match each item in Column A with an appropriate item in Column B:';
    case 'TRUE_FALSE':
      return 'Decide whether the following statements are True (T) or False (F):';
    default:
      return 'Answer the following questions:';
  }
}

interface QuestionTaskGroup {
  type: string;
  instruction: string;
  questions: ExamQuestionItem[];
}

export default function ExamDetailPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params?.id as string;

  const [exam, setExam] = useState<ExamDetailData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAnswers, setShowAnswers] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false);

  // States đổi câu hỏi
  const [activeQuestion, setActiveQuestion] = useState<QuestionDetail | null>(null);
  const [alternatives, setAlternatives] = useState<QuestionDetail[]>([]);
  const [isAltModalOpen, setIsAltModalOpen] = useState<boolean>(false);
  const [isLoadingAlt, setIsLoadingAlt] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const isDraft = Boolean(exam?.matrixBlueprint?.isDraft);

  const fetchExam = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await examService.getExamDetail(examId);
      setExam(res.data || res);
    } catch (err: unknown) {
      console.error('Lỗi khi tải chi tiết đề thi:', err);
    } finally {
      setIsLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    if (examId === 'create') {
      router.replace('/exams/create');
      return;
    }
    if (examId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void fetchExam();
    }
  }, [examId, router, fetchExam]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDraft) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDraft]);

  const handleBackWithGuard = () => {
    if (isDraft) {
      if (confirm('Bài kiểm tra này đang ở dạng bản nháp chưa lưu! Bạn có chắc muốn rời đi không?')) {
        router.push('/exams');
      }
    } else {
      router.push('/exams');
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await examService.publishExam(examId);
      alert('Đã lưu bài kiểm tra chính thức! Toàn bộ câu hỏi AI sinh bù đã được đưa vào Ngân hàng câu hỏi.');
      void fetchExam();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      alert(errorObj.response?.data?.message || 'Lỗi khi lưu đề chính thức');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDiscardDraft = async () => {
    try {
      await examService.discardDraft(examId);
      setIsCancelModalOpen(false);
      alert('Đã hủy bản nháp thành công!');
      router.replace('/exams');
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      alert(errorObj.response?.data?.message || 'Lỗi khi hủy bản nháp');
    }
  };

  const handleInlineEditContent = (questionId: string, newText: string) => {
    if (!exam) return;
    setExam({
      ...exam,
      examQuestions: exam.examQuestions.map((eq) =>
        eq.question.id === questionId
          ? { ...eq, question: { ...eq.question, content: newText } }
          : eq
      ),
    });
  };

  const structuredSections = useMemo(() => {
    if (!exam || !exam.examQuestions) return [];

    const sections = exam.matrixBlueprint?.sections;
    const rawSections: ExamSectionBlueprint[] = (!sections || sections.length === 0)
      ? [{
          sectionId: 'sec_all',
          name: 'QUESTIONS',
          questionCount: exam.examQuestions.length,
          items: [],
        }]
      : sections;

    let currentIndex = 0;
    return rawSections.map((sec: ExamSectionBlueprint, secIdx: number) => {
      const count = sec.questionCount || 0;
      const sectionQuestions = exam.examQuestions.slice(currentIndex, currentIndex + count);
      currentIndex += count;

      const tasks: QuestionTaskGroup[] = [];
      let currentTask: QuestionTaskGroup | null = null;

      sectionQuestions.forEach((eq) => {
        const qType = eq.question.type;
        if (!currentTask || currentTask.type !== qType) {
          currentTask = {
            type: qType,
            instruction: getInstructionForType(qType),
            questions: [eq],
          };
          tasks.push(currentTask);
        } else {
          currentTask.questions.push(eq);
        }
      });

      return {
        sectionId: sec.sectionId || `sec_${secIdx}`,
        name: (sec.name || '').normalize('NFC'),
        tasks,
      };
    });
  }, [exam]);

  const handleOpenSwapModal = async (q: QuestionDetail) => {
    setActiveQuestion(q);
    setIsAltModalOpen(true);
    setIsLoadingAlt(true);
    try {
      const res = await examService.getAlternatives(examId, q.id);
      setAlternatives(res.data || []);
    } catch {
      alert('Không thể tải danh sách câu hỏi thay thế từ ngân hàng.');
    } finally {
      setIsLoadingAlt(false);
    }
  };

  const handleSwapConfirm = async (newQuestionId: string) => {
    if (!activeQuestion) return;
    try {
      await examService.swapQuestion(examId, activeQuestion.id, newQuestionId);
      setIsAltModalOpen(false);
      void fetchExam();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      alert(errorObj.response?.data?.message || 'Đổi câu hỏi thất bại');
    }
  };

  const handleRegenerateAi = async (questionId: string) => {
    setActionLoadingId(questionId);
    try {
      await examService.regenerateAiQuestion(examId, questionId);
      void fetchExam();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      alert(errorObj.response?.data?.message || 'Lỗi khi AI tạo lại câu hỏi');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSaveToBank = async (questionId: string) => {
    setActionLoadingId(questionId);
    try {
      await examService.saveAiQuestionToBank(questionId);
      alert('Đã lưu câu hỏi vào ngân hàng chính thức!');
      void fetchExam();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      alert(errorObj.response?.data?.message || 'Lưu thất bại');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex justify-center items-center text-slate-500 text-sm">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải nội dung đề kiểm tra...
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-slate-600">Không tìm thấy thông tin đề thi yêu cầu.</p>
        <Button variant="outline" size="sm" onClick={() => router.push('/exams')}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5 print:p-0 print:max-w-none print:m-0">
      {/* THANH CÔNG CỤ TRÊN CÙNG (Ẩn khi in ấn) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleBackWithGuard} className="text-xs">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Danh sách đề
          </Button>
          {isDraft && (
            <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-300 gap-1 text-xs">
              <Edit3 className="w-3 h-3" /> Đang soạn bản nháp
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isDraft ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCancelModalOpen(true)}
                className="text-xs text-rose-600 hover:bg-rose-50"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Hủy bản nháp
              </Button>
              <Button
                size="sm"
                onClick={handlePublish}
                disabled={isPublishing}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs font-semibold"
              >
                {isPublishing ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                )}
                Lưu đề chính thức
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAnswers(!showAnswers)}
              className="text-xs border-blue-200 text-blue-700 bg-blue-50/50"
            >
              {showAnswers ? 'Ẩn đáp án' : 'Hiện đáp án & Hướng dẫn'}
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => window.print()}
            className="text-xs bg-slate-800 hover:bg-slate-900 text-white shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" /> In đề thi (Print)
          </Button>
        </div>
      </div>

      {/* Banner Thống kê nguồn câu hỏi (Ẩn khi in ấn) */}
      <div className="p-3 bg-linear-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl border border-indigo-100 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-600" />
          <span className="font-semibold text-slate-800">Cơ cấu nguồn câu hỏi trong đề:</span>
        </div>
        <div className="flex items-center gap-3 font-medium">
          <span className="flex items-center gap-1.5 text-blue-700 bg-blue-100/70 px-2.5 py-1 rounded-md">
            <Database className="w-3.5 h-3.5" /> Lấy từ Ngân hàng: <strong>{exam.stats?.bankCount ?? 0} câu</strong>
          </span>
          <span className="flex items-center gap-1.5 text-purple-700 bg-purple-100/70 px-2.5 py-1 rounded-md">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" /> AI tự sinh bù: <strong>{exam.stats?.aiCount ?? 0} câu</strong>
          </span>
        </div>
      </div>

      {/* TỜ ĐỀ THI CHUẨN ĐỊNH DẠNG BỘ GIÁO DỤC & ĐÀO TẠO */}
      <div className="bg-white p-8 md:p-12 shadow-xs border border-slate-200 rounded-xs font-serif text-black leading-relaxed print:p-0 print:border-none print:shadow-none print:w-full">
        
        {/* KHUNG TIÊU ĐỀ 2 CỘT */}
        <div className="border border-black divide-x divide-black grid grid-cols-12 text-center text-[13px]">
          <div className="col-span-5 p-3 flex flex-col justify-between space-y-2">
            <div>
              <p className="font-bold uppercase tracking-tight">PHÒNG GD – ĐT ....................</p>
              <p className="font-bold uppercase tracking-tight">TRƯỜNG THCS / TIỂU HỌC ....................</p>
            </div>
            <div className="text-left text-xs space-y-1 pt-2 border-t border-dashed border-slate-400 font-sans">
              <p>Họ và tên: .....................................................</p>
              <p>Lớp: ........................ SBD: .............................</p>
            </div>
          </div>

          <div className="col-span-7 p-3 flex flex-col justify-between space-y-1">
            <div>
              <p className="font-bold uppercase text-sm tracking-wide">{exam.title?.normalize('NFC')}</p>
              <p className="font-bold text-xs mt-0.5">NĂM HỌC: 2026 – 2027</p>
              <p className="font-bold text-[13px] mt-0.5">MÔN: TIẾNG ANH ({exam.grade?.name || 'K-9'})</p>
            </div>
            <p className="italic text-xs text-slate-700">
              Thời gian: {exam.durationMinutes} minutes (không kể thời gian giao đề)
            </p>
          </div>
        </div>

        {/* NỘI DUNG TỪNG PHẦN THI (SECTIONS) */}
        <div className="space-y-7 pt-6">
          {structuredSections.map((sec, secIdx) => (
            <div key={sec.sectionId || secIdx} className="space-y-4">
              
              <div className="border-b border-black/30 pb-1">
                <h3 className="font-bold text-sm uppercase tracking-wide text-black">
                  {sec.name}
                </h3>
              </div>

              <div className="space-y-6">
                {sec.tasks.map((task, taskIdx) => {
                  const showTaskPrefix = sec.tasks.length > 1;

                  return (
                    <div key={taskIdx} className="space-y-3">
                      <p className="text-[13px] italic font-semibold text-slate-900 leading-normal">
                        {showTaskPrefix ? (
                          <span><strong>Task {taskIdx + 1}.</strong> {task.instruction}</span>
                        ) : (
                          <span>{task.instruction}</span>
                        )}
                      </p>

                      <div className="space-y-3.5 pl-1">
                        {task.questions.map((eq: ExamQuestionItem) => {
                          const q = eq.question;
                          const options = q.options || {};
                          const isAiGenerated = q.tags?.includes('AI_GENERATED');
                          const isActionLoading = actionLoadingId === q.id;

                          const displayContent = cleanQuestionContent(q.content);

                          const opts = options.options || [];
                          const maxOptLen = opts.reduce((max, cur) => Math.max(max, cur.length), 0);
                          const gridColsClass = 
                            maxOptLen <= 12 
                              ? 'grid-cols-2 sm:grid-cols-4' 
                              : maxOptLen <= 28 
                              ? 'grid-cols-1 sm:grid-cols-2' 
                              : 'grid-cols-1';

                          return (
                            <div key={eq.id} className="text-[13px] space-y-1.5 group">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-1.5 flex-1">
                                  <span className="font-bold text-black whitespace-nowrap pt-0.5">
                                    {eq.questionOrder}.
                                  </span>
                                  <div className="flex-1">
                                    
                                    {/* XỬ LÝ RIÊNG CHO REORDER_SENTENCE ĐỂ KHÔNG BỊ LỘ ĐÁP ÁN */}
                                    {q.type === 'REORDER_SENTENCE' ? (
                                      <div className="space-y-1.5">
                                        <div className="font-sans font-medium text-slate-900 text-[13px]">
                                          [ {(options.shuffledWords || []).join('  /  ')} ]
                                        </div>
                                        <div className="text-slate-400 text-xs">
                                          Trả lời: ........................................................................................................................
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <span
                                          contentEditable={isDraft}
                                          suppressContentEditableWarning
                                          onBlur={(e) => handleInlineEditContent(q.id, e.currentTarget.textContent || '')}
                                          className={`text-black font-normal leading-normal ${
                                            isDraft ? 'hover:bg-amber-50 focus:bg-white focus:outline-blue-500 rounded px-1' : ''
                                          }`}
                                        >
                                          {displayContent}
                                        </span>
                                      </>
                                    )}

                                    <span className="text-slate-500 text-[11px] italic ml-1.5 print:hidden">
                                      ({Number(eq.pointWeight).toFixed(2)} đ)
                                    </span>

                                    {/* Badge nhận diện (Ẩn khi in ấn) */}
                                    <span className="ml-2 inline-flex items-center print:hidden">
                                      {isAiGenerated ? (
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-sans font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                                          <Sparkles className="w-2.5 h-2.5 text-purple-500" /> AI tạo bù
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-sans font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                                          <Database className="w-2.5 h-2.5 text-blue-500" /> Ngân hàng
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                </div>

                                {/* Nút biên soạn (Ẩn khi in ấn) */}
                                <div className="flex items-center gap-1 shrink-0 font-sans print:hidden">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => void handleOpenSwapModal(q)}
                                    className="h-6 text-[11px] px-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                                    title="Đổi câu khác cùng dạng từ ngân hàng"
                                  >
                                    <RefreshCw className="w-2.5 h-2.5 mr-1" /> Đổi câu
                                  </Button>

                                  {isAiGenerated && (
                                    <>
                                      {!isDraft && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          disabled={isActionLoading}
                                          onClick={() => void handleSaveToBank(q.id)}
                                          className="h-6 text-[11px] px-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                                          title="Lưu câu này vào ngân hàng câu hỏi chính thức"
                                        >
                                          <BookmarkCheck className="w-2.5 h-2.5 mr-1 text-emerald-600" /> Lưu vào kho
                                        </Button>
                                      )}

                                      <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={isActionLoading}
                                        onClick={() => void handleRegenerateAi(q.id)}
                                        className="h-6 text-[11px] px-1.5 text-purple-700 border-purple-200 hover:bg-purple-50"
                                        title="Tạo lại câu mới đúng tiêu chí bằng AI"
                                      >
                                        {isActionLoading ? (
                                          <Loader2 className="w-2.5 h-2.5 animate-spin mr-1" />
                                        ) : (
                                          <Sparkles className="w-2.5 h-2.5 mr-1 text-purple-600" />
                                        )}
                                        Sinh lại
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* 1. Trắc nghiệm */}
                              {q.type === 'MULTIPLE_CHOICE' && opts.length > 0 && (
                                <div className={`grid ${gridColsClass} gap-y-1 gap-x-4 pl-5 pt-0.5`}>
                                  {opts.map((opt, i) => (
                                    <div key={i} className="text-black flex items-start gap-1.5">
                                      <span className="font-bold">{String.fromCharCode(65 + i)}.</span>
                                      <span>{opt}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* 2. Nối từ */}
                              {q.type === 'MATCHING' && options.pairs && (
                                <div className="pl-5 pt-1 max-w-lg">
                                  <table className="w-full border border-black text-xs">
                                    <thead>
                                      <tr className="bg-slate-100 font-bold">
                                        <th className="border border-black p-1.5 text-left">Column A</th>
                                        <th className="border border-black p-1.5 text-left">Column B</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {options.pairs.map((p, pIdx) => (
                                        <tr key={pIdx}>
                                          <td className="border border-black p-1.5">{p.left}</td>
                                          <td className="border border-black p-1.5">{p.right}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}

                              {/* 3. Điền từ */}
                              {q.type === 'FILL_IN_BLANK' && (
                                <div className="pl-5 text-slate-400 text-xs pt-0.5">
                                  Trả lời: ........................................................................................................................
                                </div>
                              )}

                              {/* Khối Đáp án & Hướng dẫn */}
                              {showAnswers && (
                                <div className="ml-5 mt-1.5 p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-0.5 font-sans print:hidden">
                                  <p className="flex items-center gap-1 font-semibold">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    Đáp án đúng: {q.type === 'REORDER_SENTENCE' ? q.content : (typeof q.correctAnswer === 'object' ? JSON.stringify(q.correctAnswer) : String(q.correctAnswer))}
                                  </p>
                                  {q.explanation && (
                                    <p className="text-slate-600 italic">💡 Giải thích: {q.explanation}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="text-center pt-6 border-t border-black/40">
            <p className="font-bold text-xs uppercase tracking-widest">--- THE END ---</p>
            <p className="italic text-[11px] text-slate-600 mt-0.5">(Cán bộ coi thi không giải thích gì thêm)</p>
          </div>
        </div>
      </div>

      {/* DIALOG XÁC NHẬN HỦY BẢN NHÁP */}
      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600 text-base">
              <AlertTriangle className="w-5 h-5" />
              Xác nhận hủy bản nháp?
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-slate-600 leading-relaxed">
            Bạn có chắc chắn muốn hủy bản nháp đề thi này không? Toàn bộ các câu hỏi do AI tạo bù và bản nháp này sẽ bị xóa bỏ hoàn toàn mà không lưu lại vào hệ thống.
          </p>
          <DialogFooter className="gap-2 sm:gap-0 mt-3">
            <Button variant="outline" size="sm" onClick={() => setIsCancelModalOpen(false)} className="text-xs">
              Tiếp tục chỉnh sửa
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDiscardDraft} className="text-xs bg-rose-600 hover:bg-rose-700">
              Đồng ý hủy bỏ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL ĐỔI CÂU HỎI TỪ NGÂN HÀNG */}
      <Dialog open={isAltModalOpen} onOpenChange={setIsAltModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col bg-white">
          <DialogHeader className="border-b pb-2">
            <DialogTitle className="flex items-center gap-2 text-slate-800 text-sm">
              <Database className="w-4 h-4 text-blue-600" />
              Chọn câu hỏi thay thế từ Ngân hàng câu hỏi
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-3 space-y-2 pr-1 text-xs">
            {isLoadingAlt ? (
              <div className="py-12 flex justify-center text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tìm kiếm câu hỏi phù hợp trong kho...
              </div>
            ) : alternatives.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                Không còn câu hỏi nào khác cùng dạng ({activeQuestion?.type}) và độ khó ({activeQuestion?.difficulty}) trong ngân hàng.
              </div>
            ) : (
              alternatives.map((alt) => (
                <div
                  key={alt.id}
                  className="p-3 border rounded-lg hover:border-blue-400 hover:bg-blue-50/20 transition flex justify-between items-start gap-3"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex gap-1.5 items-center">
                      <Badge variant="secondary" className="text-[10px]">{alt.type}</Badge>
                      <Badge variant="outline" className="text-[10px] text-blue-600">{alt.difficulty}</Badge>
                    </div>
                    <p className="font-semibold text-slate-800">{cleanQuestionContent(alt.content)}</p>
                    <p className="text-slate-500 text-[11px]">Đáp án: {String(alt.correctAnswer)}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => void handleSwapConfirm(alt.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 shrink-0"
                  >
                    Chọn câu này
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}