"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useEditor, EditorContent, type Content } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { AudioExtension } from "./extensions/AudioExtension";

import { LessonToolbar } from "./LessonToolbar";
import { AiGeneratorSidebar } from "./AiGeneratorSidebar";
import { CheckCircle2, Send, Loader2, Save, Edit3 } from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface LessonEditorProps {
  initialContent?: string | Record<string, unknown>;
  lessonId: string;
}

export interface LessonMetadata {
  title?: string;
  grade?: string | number;
  topic?: string;
  skill?: string;
}

function extractContentForEditor(raw: unknown): Content | null {
  if (!raw) return null;
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && raw !== null) {
    const obj = raw as Record<string, unknown>;
    if (typeof obj.html === "string" && obj.html.trim() !== "") {
      return obj.html;
    }
    if (obj.json && typeof obj.json === "object" && (obj.json as Record<string, unknown>).type === "doc") {
      return obj.json as Content;
    }
    if (obj.type === "doc") {
      return obj as Content;
    }
  }
  return null;
}

export const LessonEditor = ({ initialContent, lessonId }: LessonEditorProps) => {
  const [saveStatus, setSaveStatus] = useState<"SAVED" | "SAVING" | "UNSAVED">("SAVED");
  const [publishing, setPublishing] = useState<boolean>(false);
  const [metadata, setMetadata] = useState<LessonMetadata | null>(null);
  
  // Quản lý riêng tiêu đề bài học hiển thị tại header
  const [lessonTitle, setLessonTitle] = useState<string>("");
  const [pendingContent, setPendingContent] = useState<Content | null>(null);

  const isLoadedRef = useRef<boolean>(false);

  const contentToLoad = typeof initialContent === "string" 
    ? initialContent 
    : (initialContent as { html?: string; json?: Record<string, unknown> })?.html ||
      (initialContent as { html?: string; json?: Record<string, unknown> })?.json || 
      "";

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({
        placeholder: "Bắt đầu soạn thảo kế hoạch bài dạy hoặc dùng AI Assistant bên trái...",
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      AudioExtension,
    ],
    content: contentToLoad,
    editorProps: {
      attributes: {
        class: "prose prose-slate max-w-none focus:outline-none min-h-[500px] p-6",
      },
    },
    onUpdate: () => {
      if (isLoadedRef.current) {
        setSaveStatus("UNSAVED");
      }
    },
  });

  // Tải chi tiết bài học từ server
  const fetchLessonDetail = useCallback(async () => {
    if (!lessonId) return;

    try {
      const res = await apiClient.get(`/lessons/${lessonId}`);
      const lesson = res.data?.data || res.data;

      if (lesson) {
        const gradeName = lesson.grade?.name || "";
        const parsedGrade = parseInt(gradeName.replace(/\D/g, ""), 10) || 5;

        setLessonTitle(lesson.title || "Bài giảng mới");
        setMetadata({
          title: lesson.title || "Bài giảng mới",
          grade: parsedGrade,
          topic: lesson.topic?.name || "", // TUYỆT ĐỐI KHÔNG FALLBACK VỀ lesson.title
          skill: lesson.skill || lesson.primarySkill || "Reading",
        });

        const rawContent = lesson.currentVersion?.content;
        const validContent = extractContentForEditor(rawContent);

        if (validContent) {
          setPendingContent(validContent);
          if (editor && !editor.isDestroyed) {
            editor.commands.setContent(validContent, { emitUpdate: false });
            isLoadedRef.current = true;
            setSaveStatus("SAVED");
          }
        } else {
          isLoadedRef.current = true;
        }
      }
    } catch (err) {
      console.error("Lỗi khi tải chi tiết bài học:", err);
      isLoadedRef.current = true;
    }
  }, [lessonId, editor]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchLessonDetail();
  }, [fetchLessonDetail]);

  useEffect(() => {
    if (editor && pendingContent && !isLoadedRef.current && !editor.isDestroyed) {
      editor.commands.setContent(pendingContent, { emitUpdate: false });
      isLoadedRef.current = true;
      setSaveStatus("SAVED");
    }
  }, [editor, pendingContent]);

  // Lưu bài học
  const executeSave = useCallback(async (isManual = false) => {
    if (!editor || !lessonId) return;

    setSaveStatus("SAVING");
    try {
      const finalTitle = lessonTitle.trim() || "Bài giảng mới";
      const payload = {
        title: finalTitle,
        content: {
          html: editor.getHTML(),
          json: editor.getJSON(),
        },
      };

      await apiClient.put(`/lessons/${lessonId}`, payload);
      setSaveStatus("SAVED");
      if (isManual) {
        alert("Đã lưu giáo án thành công!");
      }
    } catch (err: unknown) {
      console.error("Lỗi lưu giáo án:", err);
      setSaveStatus("UNSAVED");
      if (isManual) {
        const msg = err instanceof Error ? err.message : "Lỗi không xác định";
        alert("Không thể lưu giáo án: " + msg);
      }
    }
  }, [editor, lessonId, lessonTitle]);

  // Tự động lưu sau 2.5s khi dừng gõ
  useEffect(() => {
    if (saveStatus !== "UNSAVED") return;

    const timer = setTimeout(() => {
      void executeSave(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, [saveStatus, executeSave]);

  // Xuất bản bài học
  const handlePublish = async () => {
    if (!confirm("Bạn có chắc chắn muốn xuất bản bài học này?")) return;
    setPublishing(true);
    try {
      if (editor) {
        await apiClient.put(`/lessons/${lessonId}`, {
          title: lessonTitle.trim() || "Bài giảng mới",
          content: {
            html: editor.getHTML(),
            json: editor.getJSON(),
          },
        });
      }

      await apiClient.patch(`/lessons/${lessonId}/publish`);
      setSaveStatus("SAVED");
      alert("Xuất bản bài học thành công!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Xuất bản thất bại";
      alert("Lỗi: " + msg);
    } finally {
      setPublishing(false);
    }
  };

  const handleInsertHtml = (html: string) => {
    if (editor) {
      editor.commands.insertContent(html);
      setSaveStatus("UNSAVED");
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] w-full border border-slate-200 bg-white rounded-lg shadow-sm overflow-hidden">
      <AiGeneratorSidebar 
        onInsertContent={handleInsertHtml} 
        initialMetadata={metadata} 
      />

      <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
        {/* Header với ô đổi tên Tiêu đề bài học */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-2.5 bg-white border-b border-slate-200 gap-3">
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <div className="relative flex-1 flex items-center">
              <Edit3 className="w-4 h-4 text-slate-400 absolute left-2.5 pointer-events-none" />
              <input
                type="text"
                value={lessonTitle}
                onChange={(e) => {
                  setLessonTitle(e.target.value);
                  setSaveStatus("UNSAVED");
                }}
                placeholder="Nhập tiêu đề bài học (vd: Bài 1, Tiết 12...)..."
                className="w-full pl-8 pr-3 py-1.5 text-sm font-semibold text-slate-800 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-md outline-none transition"
              />
            </div>
            
            <div className="text-xs shrink-0">
              {saveStatus === "SAVING" && (
                <span className="text-amber-600 font-medium flex items-center gap-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang lưu...
                </span>
              )}
              {saveStatus === "SAVED" && (
                <span className="text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đã lưu
                </span>
              )}
              {saveStatus === "UNSAVED" && (
                <span className="text-amber-600 font-medium">Chưa lưu thay đổi...</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void executeSave(true)}
              disabled={saveStatus === "SAVING"}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium transition border border-slate-300"
            >
              <Save className="w-3.5 h-3.5" />
              Lưu nháp
            </button>

            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded text-xs font-medium transition"
            >
              {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Xuất bản
            </button>
          </div>
        </div>

        <LessonToolbar editor={editor} />

        <div className="flex-1 overflow-y-auto p-8 flex justify-center">
          <div className="w-full max-w-4xl bg-white min-h-full rounded-md shadow-sm border border-slate-200">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </div>
  );
};