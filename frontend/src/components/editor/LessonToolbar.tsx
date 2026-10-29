"use client";

import React from "react";
import { type Editor } from "@tiptap/react";
import "@tiptap/starter-kit";
import "@tiptap/extension-table";
import { 
  Bold, Italic, List, ListOrdered, Heading1, Heading2, 
  Quote, Undo, Redo, Table as TableIcon 
} from "lucide-react";

interface ToolbarProps {
  editor: Editor | null;
}

export const LessonToolbar = ({ editor }: ToolbarProps) => {
  if (!editor) return null;

  const buttonClass = (isActive: boolean) =>
    `p-2 rounded hover:bg-slate-100 transition-colors ${
      isActive ? "bg-blue-100 text-blue-600 font-semibold" : "text-slate-600"
    }`;

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-white p-2 sticky top-0 z-10">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={buttonClass(editor.isActive("heading", { level: 1 }))}
        title="Tiêu đề 1"
      >
        <Heading1 className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={buttonClass(editor.isActive("heading", { level: 2 }))}
        title="Tiêu đề 2"
      >
        <Heading2 className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-slate-300 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={buttonClass(editor.isActive("bold"))}
        title="In đậm (Ctrl+B)"
      >
        <Bold className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={buttonClass(editor.isActive("italic"))}
        title="In nghiêng (Ctrl+I)"
      >
        <Italic className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-slate-300 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={buttonClass(editor.isActive("bulletList"))}
        title="Danh sách gạch đầu dòng"
      >
        <List className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={buttonClass(editor.isActive("orderedList"))}
        title="Danh sách số"
      >
        <ListOrdered className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={buttonClass(editor.isActive("blockquote"))}
        title="Trích dẫn / Ghi chú"
      >
        <Quote className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() =>
          editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run()
        }
        className={buttonClass(false)}
        title="Chèn bảng"
      >
        <TableIcon className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-slate-300 mx-1 ml-auto" />

      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
        title="Hoàn tác"
      >
        <Undo className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
        title="Làm lại"
      >
        <Redo className="w-4 h-4" />
      </button>
    </div>
  );
};