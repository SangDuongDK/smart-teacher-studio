"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, PlusCircle, Loader2, HelpCircle, Database, Headphones } from "lucide-react";
import { TargetSkill, AIGeneratedContent } from "@/types/lesson";
import { LessonMetadata } from "./LessonEditor";
import AiExerciseModal from "@/components/questions/AiExerciseModal";
import { questionService } from "@/services/question.service";
import { GenerateExerciseInput } from "@/types/question";
import SelectQuestionBankModal from "@/components/questions/SelectQuestionBankModal";

const API_BASE = "http://localhost:4000/api";

interface ExtendedAiContent extends AIGeneratedContent {
  audioScript?: string;
}

interface ComplexObjectives {
  knowledge?: string[];
  skills?: string[];
  attitudes?: string[];
}

interface ComplexVocabularyItem {
  word?: string;
  phonetic?: string;
  meaning?: string;
  meaningVi?: string;
}

interface ComplexGrammar {
  targetStructure?: string;
  structure?: string;
  formula?: string;
  explanationVi?: string;
  note?: string;
  examples?: string[];
}

interface ComplexActivityItem {
  stage?: string;
  title?: string;
  activityName?: string;
  name?: string;
  durationMinutes?: number;
  instructionsVi?: string;
  desc?: string;
  studentActions?: string;
}

interface AiSidebarProps {
  onInsertContent: (htmlContent: string) => void;
  initialMetadata?: LessonMetadata | null;
}

export const AiGeneratorSidebar = ({ onInsertContent, initialMetadata }: AiSidebarProps) => {
  const [customGrade, setCustomGrade] = useState<number | null>(null);
  const [customSkill, setCustomSkill] = useState<TargetSkill | null>(null);
  
  const [topic, setTopic] = useState<string>("Animals");

  const [unit, setUnit] = useState<string>("Unit 1");
  const [duration, setDuration] = useState<number>(45);
  const [difficulty, setDifficulty] = useState<string>("Intermediate");
  const [additionalRequirements, setAdditionalRequirements] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<ExtendedAiContent | null>(null);

  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState<boolean>(false);
  const [isExerciseLoading, setIsExerciseLoading] = useState<boolean>(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState<boolean>(false);
  const [isTtsLoading, setIsTtsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (initialMetadata?.topic && initialMetadata.topic.trim() !== "") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTopic(initialMetadata.topic);
    }
  }, [initialMetadata?.topic]);

  const initialGrade = initialMetadata?.grade ? Number(initialMetadata.grade) : 5;
  const currentGrade = customGrade ?? initialGrade;

  const initialSkill: TargetSkill = initialMetadata?.skill
    ? ((initialMetadata.skill.charAt(0).toUpperCase() +
        initialMetadata.skill.slice(1).toLowerCase()) as TargetSkill)
    : "Reading";
  const currentSkill = customSkill ?? initialSkill;

  // Format hiển thị kịch bản nghe
  const formatAudioScriptHtml = (rawScript: string): string => {
    if (!rawScript || !rawScript.trim()) return "";

    return rawScript
      .replace(/\s*([A-Za-z0-9_\s]{2,20}:)/g, "\n$1")
      .trim()
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => {
        const colonIndex = line.indexOf(":");
        if (colonIndex !== -1) {
          const speaker = line.slice(0, colonIndex + 1);
          const speech = line.slice(colonIndex + 1);
          return `<p style="margin: 6px 0;"><strong>${speaker.trim()}</strong> ${speech.trim()}</p>`;
        }
        return `<p style="margin: 6px 0;">${line.trim()}</p>`;
      })
      .join("");
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setErrorMsg("Vui lòng nhập tên chủ đề");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const payload = {
        grade: Number(currentGrade),
        topic: topic.trim(),
        unit: unit.trim(),
        skill: currentSkill,
        duration: Number(duration),
        difficulty: difficulty,
        additionalRequirements: additionalRequirements.trim(),
      };

      const token = typeof window !== "undefined" 
        ? localStorage.getItem("access_token") || localStorage.getItem("token") || "" 
        : "";

      const res = await fetch(`${API_BASE}/ai/generate-lesson`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const responseJson = await res.json();

      if (!res.ok) {
        throw new Error(responseJson.message || "Không thể tạo nội dung từ AI");
      }

      setAiResult((responseJson.data || responseJson) as ExtendedAiContent);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Đã xảy ra lỗi không xác định khi gọi AI");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateExercisesAndInsert = async (params: GenerateExerciseInput) => {
    setIsExerciseLoading(true);
    try {
      const exercises = await questionService.generateExercises(params);

      if (!exercises || exercises.length === 0) {
        alert("Không có câu hỏi nào được tạo. Vui lòng thử lại!");
        return;
      }

      let html = `<h3>📝 Phiếu bài tập củng cố (Practice Exercises) - ${params.topic}</h3><ol>`;

      exercises.forEach((ex) => {
        html += `<li><strong>${ex.content}</strong>`;

        if (ex.type === "MULTIPLE_CHOICE" && ex.options?.options) {
          html += `<ul>${ex.options.options
            .map((opt, i) => `<li>${String.fromCharCode(65 + i)}.${opt}</li>`)
            .join("")}</ul>`;
        }

        if (ex.type === "REORDER_SENTENCE" && ex.options?.shuffledWords) {
          html += `<p><em>Từ gợi ý: [ ${ex.options.shuffledWords.join(" / ")} ]</em></p>`;
        }

        if (ex.type === "MATCHING" && ex.options?.pairs) {
          html += `<table border="1"><thead><tr><th>Cột A</th><th>Cột B</th></tr></thead><tbody>`;
          ex.options.pairs.forEach((p: { left: string; right: string }) => {
            html += `<tr><td>${p.left}</td><td>${p.right}</td></tr>`;
          });
          html += `</tbody></table>`;
        }

        html += `<p><em>👉 <strong>Đáp án:</strong> ${String(ex.correctAnswer)}</em></p>`;
        if (ex.explanation) {
          html += `<p><em>💡 <strong>Giải thích:</strong> ${ex.explanation}</em></p>`;
        }

        html += `</li>`;
      });

      html += `</ol><p></p>`;

      onInsertContent(html);
      setIsExerciseModalOpen(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("Lỗi khi sinh bài tập từ AI");
      }
    } finally {
      setIsExerciseLoading(false);
    }
  };

  const handleGenerateAudioAndInsert = async () => {
    const script = aiResult?.audioScript;
    if (!script || !script.trim()) {
      alert("Chưa có kịch bản nghe để chuyển thành âm thanh!");
      return;
    }

    setIsTtsLoading(true);
    try {
      const token = typeof window !== "undefined" 
        ? localStorage.getItem("access_token") || localStorage.getItem("token") || "" 
        : "";
      const res = await fetch(`${API_BASE}/ai/tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text: script, lang: "en" }),
      });

      if (!res.ok) {
        throw new Error("Không thể chuyển đổi âm thanh");
      }

      const data = await res.json();
      const audioSource = data.audioBase64 || `http://localhost:4000${data.fileUrl}`;

      const audioHtml = `
        <h3>🔊 File bài nghe học sinh (Listening Audio)</h3>
        <audio src="${audioSource}" controls="true"></audio>
        <h4>📝 Lời thoại bài nghe (Transcript):</h4>
        <blockquote>
          ${formatAudioScriptHtml(script)}
        </blockquote>
        <p></p>
      `;

      onInsertContent(audioHtml);
      alert("Đã tạo file âm thanh MP3 và gắn vào giáo án thành công!");
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("Lỗi khi kết nối đến dịch vụ AI Audio");
      }
    } finally {
      setIsTtsLoading(false);
    }
  };

  const insertObjectives = () => {
    if (!aiResult?.objectives) return;
    const rawObj = aiResult.objectives as unknown;
    let allPoints: string[] = [];
    if (Array.isArray(rawObj)) {
      allPoints = rawObj as string[];
    } else if (typeof rawObj === "object" && rawObj !== null) {
      const typedObj = rawObj as ComplexObjectives;
      allPoints = [
        ...(typedObj.knowledge || []),
        ...(typedObj.skills || []),
        ...(typedObj.attitudes || []),
      ];
    }
    if (allPoints.length === 0) return;
    const itemsHtml = allPoints.map((item) => `<li>${item}</li>`).join("");
    onInsertContent(`<h3>🎯 Mục tiêu bài học (Objectives)</h3><ul>${itemsHtml}</ul><p></p>`);
  };

  const insertVocabulary = () => {
    if (!aiResult?.vocabulary || aiResult.vocabulary.length === 0) return;
    const rawVocab = aiResult.vocabulary as unknown as ComplexVocabularyItem[];
    const rows = rawVocab
      .map((v) => {
        const word = v.word || "";
        const phonetic = v.phonetic || "";
        const meaning = v.meaningVi || v.meaning || "";
        return `<tr><td><strong>${word}</strong></td><td>${phonetic}</td><td>${meaning}</td></tr>`;
      })
      .join("");
    onInsertContent(`<h3>📚 Từ vựng trọng tâm (Vocabulary)</h3><table border="1"><thead><tr><th>Từ vựng</th><th>Phiên âm</th><th>Nghĩa</th></tr></thead><tbody>${rows}</tbody></table><p></p>`);
  };

  const insertAudioScript = () => {
    const script = aiResult?.audioScript;
    if (!script || !script.trim()) return;

    const html = `
      <h3>🎧 Kịch bản bài nghe (Listening Audio Script)</h3>
      <p><em>(Dành cho giáo viên đọc trên lớp hoặc dùng cho AI Audio tạo file âm thanh MP3)</em></p>
      <blockquote>
        ${formatAudioScriptHtml(script)}
      </blockquote>
      <p></p>
    `;

    onInsertContent(html);
  };

  const insertGrammar = () => {
    if (!aiResult?.grammar) return;
    const g = aiResult.grammar as unknown as ComplexGrammar;
    const structure = g.targetStructure || g.structure || g.formula || "";
    const explanation = g.explanationVi || g.note || "";
    const examplesHtml = Array.isArray(g.examples) && g.examples.length > 0
      ? `<ul>${g.examples.map((ex) => `<li><em>${ex}</em></li>`).join("")}</ul>`
      : "";

    onInsertContent(`
      <h3>💡 Ngữ pháp (Grammar Structure)</h3>
      <blockquote>
        <p><strong>Cấu trúc:</strong> ${structure}</p>
        ${explanation ? `<p><strong>Giải thích:</strong> ${explanation}</p>` : ""}
        ${examplesHtml ? `<p><strong>Ví dụ:</strong></p>${examplesHtml}` : ""}
      </blockquote>
      <p></p>
    `);
  };

  const insertActivities = () => {
    if (!aiResult?.activities || aiResult.activities.length === 0) return;
    const rawActs = aiResult.activities as unknown as ComplexActivityItem[];
    const items = rawActs
      .map((act) => {
        const stage = act.stage || "Hoạt động";
        const title = act.title || act.activityName || act.name || "";
        const durationText = act.durationMinutes ? ` (${act.durationMinutes} phút)` : "";
        const instructions = act.instructionsVi || act.desc || act.studentActions || "";
        return `<li><strong>${stage}${durationText}: ${title}</strong><br/><span>${instructions}</span></li>`;
      })
      .join("");
    onInsertContent(`<h3>⏱ Kế hoạch hoạt động dạy học</h3><ol>${items}</ol><p></p>`);
  };

  const insertAll = () => {
    let combinedHtml = "";
    if (aiResult?.objectives) {
      const rawObj = aiResult.objectives as unknown;
      let allPoints: string[] = [];
      if (Array.isArray(rawObj)) {
        allPoints = rawObj as string[];
      } else if (typeof rawObj === "object" && rawObj !== null) {
        const typedObj = rawObj as ComplexObjectives;
        allPoints = [
          ...(typedObj.knowledge || []),
          ...(typedObj.skills || []),
          ...(typedObj.attitudes || []),
        ];
      }
      if (allPoints.length > 0) {
        combinedHtml += `<h3>🎯 Mục tiêu bài học (Objectives)</h3><ul>${allPoints.map((item) => `<li>${item}</li>`).join("")}</ul>`;
      }
    }

    if (aiResult?.vocabulary && aiResult.vocabulary.length > 0) {
      const rawVocab = aiResult.vocabulary as unknown as ComplexVocabularyItem[];
      const rows = rawVocab
        .map((v) => {
          const word = v.word || "";
          const phonetic = v.phonetic || "";
          const meaning = v.meaningVi || v.meaning || "";
          return `<tr><td><strong>${word}</strong></td><td>${phonetic}</td><td>${meaning}</td></tr>`;
        })
        .join("");
      combinedHtml += `<h3>📚 Từ vựng trọng tâm (Vocabulary)</h3><table border="1"><thead><tr><th>Từ vựng</th><th>Phiên âm</th><th>Nghĩa</th></tr></thead><tbody>${rows}</tbody></table><p></p>`;
    }

    const script = aiResult?.audioScript;
    if (script && script.trim()) {
      combinedHtml += `
        <div style="background-color: #fefce8; border: 1.5px solid #fde047; padding: 14px; border-radius: 8px; margin: 16px 0;">
          <h4 style="margin: 0 0 6px 0; color: #854d0e; font-weight: bold; font-size: 14px;">
            🎧 Kịch bản bài nghe (Listening Audio Script)
          </h4>
          <p style="font-size: 11px; color: #713f12; font-style: italic; margin-bottom: 8px;">
            (Dành cho giáo viên đọc trên lớp hoặc dùng cho AI Audio tạo file âm thanh MP3)
          </p>
          <div style="background-color: #ffffff; padding: 10px 12px; border-radius: 6px; border: 1px dashed #ca8a04; font-family: monospace; font-size: 13px; line-height: 1.6; color: #1e293b;">
            ${formatAudioScriptHtml(script)}
          </div>
        </div>
      `;
    }

    if (aiResult?.grammar) {
      const g = aiResult.grammar as unknown as ComplexGrammar;
      const structure = g.targetStructure || g.structure || g.formula || "";
      const explanation = g.explanationVi || g.note || "";
      const examples = Array.isArray(g.examples)
        ? `<ul>${g.examples.map((ex: string) => `<li>${ex}</li>`).join("")}</ul>`
        : "";
      combinedHtml += `<h3>💡 Ngữ pháp (Grammar Structure)</h3><blockquote><p><strong>Cấu trúc:</strong> ${structure}</p>${explanation ? `<p><strong>Giải thích:</strong> ${explanation}</p>` : ""}${examples}</blockquote><p></p>`;
    }

    if (aiResult?.activities && aiResult.activities.length > 0) {
      const rawActs = aiResult.activities as unknown as ComplexActivityItem[];
      const items = rawActs
        .map((act) => {
          const stage = act.stage || "Hoạt động";
          const title = act.title || act.activityName || act.name || "";
          const durationText = act.durationMinutes ? ` (${act.durationMinutes} phút)` : "";
          const instructions = act.instructionsVi || act.desc || act.studentActions || "";
          return `<li><strong>${stage}${durationText}: ${title}</strong> - ${instructions}</li>`;
        })
        .join("");
      combinedHtml += `<h3>⏱ Kế hoạch hoạt động dạy học</h3><ol>${items}</ol><p></p>`;
    }

    if (combinedHtml) {
      onInsertContent(combinedHtml);
    }
  };

  const hasAudioScript = Boolean(aiResult?.audioScript && aiResult.audioScript.trim() !== "");

  return (
    <div className="w-84 border-r border-slate-200 bg-slate-50 flex flex-col h-full p-4 overflow-y-auto">
      <div className="flex items-center gap-2 mb-3 text-purple-700 font-bold text-base">
        <Sparkles className="w-5 h-5" />
        <h2>AI Lesson Assistant</h2>
      </div>

      <div className="space-y-2.5 bg-white p-3 rounded-lg border border-slate-200 shadow-sm text-xs">
        <div>
          <label className="block text-slate-600 font-semibold mb-1">Khối lớp (1 - 9)</label>
          <select
            value={currentGrade}
            onChange={(e) => setCustomGrade(Number(e.target.value))}
            className="w-full border border-slate-300 rounded p-1.5 focus:outline-blue-500 bg-white"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => (
              <option key={g} value={g}>
                Lớp {g}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-1">
            <label className="block text-slate-600 font-semibold mb-1">Unit</label>
            <input
              type="text"
              value={unit}
              maxLength={20}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full border border-slate-300 rounded p-1.5 focus:outline-blue-500"
              placeholder="vd: Unit 1"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-slate-600 font-semibold mb-1">Chủ đề (Topic) *</label>
            <input
              type="text"
              value={topic}
              maxLength={100}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full border border-slate-300 rounded p-1.5 focus:outline-blue-500"
              placeholder="vd: Animals, Family..."
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Kỹ năng</label>
            <select
              value={currentSkill}
              onChange={(e) => setCustomSkill(e.target.value as TargetSkill)}
              className="w-full border border-slate-300 rounded p-1.5 focus:outline-blue-500 bg-white"
            >
              <option value="Reading">Reading</option>
              <option value="Listening">Listening</option>
              <option value="Speaking">Speaking</option>
              <option value="Writing">Writing</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">Độ khó</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full border border-slate-300 rounded p-1.5 focus:outline-blue-500 bg-white"
            >
              <option value="Beginner">Cơ bản</option>
              <option value="Intermediate">Trung bình</option>
              <option value="Advanced">Nâng cao</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-slate-600 font-semibold mb-1">Thời lượng (phút)</label>
          <input
            type="number"
            min={15}
            max={120}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full border border-slate-300 rounded p-1.5 focus:outline-blue-500"
          />
        </div>

        <div>
          <label className="block text-slate-600 font-semibold mb-1">Yêu cầu bổ sung (nếu có)</label>
          <textarea
            rows={2}
            value={additionalRequirements}
            maxLength={200}
            onChange={(e) => setAdditionalRequirements(e.target.value)}
            className="w-full border border-slate-300 rounded p-1.5 focus:outline-blue-500 resize-none"
            placeholder="vd: Chú trọng hoạt động cặp đôi, trò chơi tương tác..."
          />
        </div>

        {errorMsg && <p className="text-xs text-rose-500">{errorMsg}</p>}

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full mt-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-medium py-2 rounded flex items-center justify-center gap-2 transition"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? "Đang tạo nội dung..." : "Sinh giáo án bằng AI"}
        </button>

        <button
          type="button"
          onClick={() => setIsExerciseModalOpen(true)}
          className="w-full mt-2 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 font-medium py-2 rounded flex items-center justify-center gap-2 transition text-xs"
        >
          <HelpCircle className="w-4 h-4 text-indigo-600" />
          <span>Tạo bài tập trắc nghiệm bằng AI</span>
        </button>

        <button
          type="button"
          onClick={() => setIsBankModalOpen(true)}
          className="w-full mt-2 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 font-medium py-2 rounded flex items-center justify-center gap-2 transition text-xs"
        >
          <Database className="w-4 h-4 text-slate-600" />
          <span>Chọn câu hỏi từ Ngân hàng</span>
        </button>
      </div>

      <AiExerciseModal
        open={isExerciseModalOpen}
        onOpenChange={setIsExerciseModalOpen}
        onGenerate={(params) =>
          handleGenerateExercisesAndInsert({
            ...params,
            context: aiResult?.audioScript || undefined,
          })
        }
        isLoading={isExerciseLoading}
        defaultTopic={topic || "Animals"}
        defaultGrade={currentGrade}
      />

      <SelectQuestionBankModal
        open={isBankModalOpen}
        onOpenChange={setIsBankModalOpen}
        onInsertContent={onInsertContent}
      />

      {aiResult && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Khối nội dung AI
            </span>
            <button onClick={insertAll} className="text-xs text-purple-600 hover:underline font-medium">
              Chèn tất cả
            </button>
          </div>

          <div className="p-3 bg-white rounded border border-slate-200">
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-sm text-slate-800">Mục tiêu</span>
              <button onClick={insertObjectives} className="text-blue-600 hover:text-blue-800" title="Chèn vào bài soạn">
                <PlusCircle className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              {Array.isArray(aiResult.objectives)
                ? aiResult.objectives.length
                : ((aiResult.objectives as unknown as ComplexObjectives)?.knowledge?.length || 0) +
                  ((aiResult.objectives as unknown as ComplexObjectives)?.skills?.length || 0) +
                  ((aiResult.objectives as unknown as ComplexObjectives)?.attitudes?.length || 0)}{" "}
              mục tiêu
            </p>
          </div>

          <div className="p-3 bg-white rounded border border-slate-200">
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-sm text-slate-800">Từ vựng</span>
              <button onClick={insertVocabulary} className="text-blue-600 hover:text-blue-800" title="Chèn vào bài soạn">
                <PlusCircle className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500">{aiResult.vocabulary?.length || 0} từ vựng</p>
          </div>

          {hasAudioScript && (
            <div className="p-3 bg-amber-50 rounded border border-amber-200 space-y-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-sm text-amber-900 flex items-center gap-1.5">
                  <Headphones className="w-4 h-4 text-amber-600" />
                  Kịch bản bài nghe
                </span>
                <button
                  onClick={insertAudioScript}
                  className="text-amber-700 hover:text-amber-900"
                  title="Chèn văn bản kịch bản vào bài soạn"
                >
                  <PlusCircle className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-amber-700 italic line-clamp-2">
                {aiResult.audioScript?.trim()}
              </p>

              <button
                type="button"
                onClick={handleGenerateAudioAndInsert}
                disabled={isTtsLoading}
                className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white font-medium py-1.5 px-2 rounded flex items-center justify-center gap-1.5 transition text-xs shadow-xs"
              >
                {isTtsLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang chuyển đổi giọng đọc...
                  </>
                ) : (
                  <>
                    <Headphones className="w-3.5 h-3.5" /> Tạo file âm thanh MP3 (AI Audio)
                  </>
                )}
              </button>
            </div>
          )}

          <div className="p-3 bg-white rounded border border-slate-200">
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-sm text-slate-800">Ngữ pháp</span>
              <button onClick={insertGrammar} className="text-blue-600 hover:text-blue-800" title="Chèn vào bài soạn">
                <PlusCircle className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              {(aiResult.grammar as unknown as ComplexGrammar)?.targetStructure ||
                aiResult.grammar?.structure ||
                "Không có"}
            </p>
          </div>

          <div className="p-3 bg-white rounded border border-slate-200">
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-sm text-slate-800">Hoạt động</span>
              <button onClick={insertActivities} className="text-blue-600 hover:text-blue-800" title="Chèn vào bài soạn">
                <PlusCircle className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500">{aiResult.activities?.length || 0} hoạt động</p>
          </div>
        </div>
      )}
    </div>
  );
};