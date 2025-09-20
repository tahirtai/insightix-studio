"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useEditor, EditorContent } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Undo,
  Redo,
  Download,
  Save,
  Clock,
  FileText,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Quote,
  Code,
  Maximize,
  Minimize,
  Eye,
  EyeOff
} from "lucide-react";

type Document = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export default function DocumentEditorPage() {
  // rename projectId to _projectId to avoid unused var lint error while keeping value available if you need later
  const { projectId: _projectId, docId } = useParams();
  const [document, setDocument] = useState<Document | null>(null);
  const [title, setTitle] = useState<string>("");
  const [mounted, setMounted] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  const [wordCount, setWordCount] = useState(0);
  const [theme, setTheme] = useState<"light" | "dark" | "sepia">("light");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const fetchDoc = async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("id", docId)
        .single();

      if (error) console.error("Error fetching document:", error);
      else {
        setDocument(data);
        setTitle(data.title);
      }
    };

    fetchDoc();
  }, [docId]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content:
      document?.content && document.content !== ""
        ? JSON.parse(document.content)
        : "<p>Start writing your masterpiece...</p>",
    onUpdate: ({ editor }) => {
      const json = JSON.stringify(editor.getJSON());
      const text = editor.getText();
      setWordCount(text.split(/\s+/).filter((word) => word.length > 0).length);

      supabase
        .from("documents")
        .update({ content: json })
        .eq("id", docId)
        .then(({ error }) => {
          if (error) console.error("Error saving content:", error);
          else setLastSaved(new Date());
        });
    },
    editorProps: {
      attributes: {
        class: "focus:outline-none prose prose-lg max-w-none min-h-[500px] p-6",
        spellCheck: "true",
      },
    },
    immediatelyRender: false,
  });

  const saveTitle = async () => {
    if (!title || title === document?.title) return;
    const { error } = await supabase.from("documents").update({ title }).eq("id", docId);
    if (error) console.error("Error saving title:", error);
    else if (document) {
      setDocument({ ...document, title });
      setLastSaved(new Date());
    }
  };

  const downloadDocument = () => {
    if (!editor || !document) return;

    const content = editor.getHTML();
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title || "Untitled Document"}</title>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; line-height: 1.6; color: #333; }
h1 { color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
h2 { color: #374151; margin-top: 30px; }
p { margin-bottom: 15px; }
ul, ol { margin-bottom: 15px; }
blockquote { border-left: 4px solid #2563eb; padding-left: 20px; margin: 20px 0; font-style: italic; }
</style>
</head>
<body>
<h1>${title || "Untitled Document"}</h1>
<p style="color: #6b7280; font-size: 0.9em; margin-bottom: 30px;">
Created: ${new Date(document.created_at).toLocaleDateString()} | 
Last updated: ${new Date(document.updated_at).toLocaleDateString()}
</p>
${content}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: "text/html" });
    const url = window.URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = `${title || "document"}.html`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadAsText = () => {
    if (!editor) return;
    const text = editor.getText();
    const blob = new Blob([text], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = `${title || "document"}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getThemeClasses = () => {
    switch (theme) {
      case "dark":
        return "bg-gray-900 text-white";
      case "sepia":
        return "bg-amber-50 text-amber-900";
      default:
        return "bg-white text-gray-900";
    }
  };

  const getEditorThemeClasses = () => {
    switch (theme) {
      case "dark":
        return "bg-gray-800 text-white border-gray-700";
      case "sepia":
        return "bg-amber-25 text-amber-800 border-amber-200";
      default:
        return "bg-white text-gray-900 border-gray-300";
    }
  };

  if (!mounted) return null;
  if (!document)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-4 text-lg">Loading document...</span>
      </div>
    );
  if (!editor) return null;

  // Toolbar Component
  const MenuBar = ({ editor }: { editor: Editor | null }) => {
    if (!editor) return null;

    const ButtonGroup = ({ children }: { children: React.ReactNode }) => (
      <div className="flex items-center space-x-1 px-2 py-1 bg-gray-50 rounded-lg border border-gray-200">
        {children}
      </div>
    );

    const ToolbarButton = ({
      isActive,
      onClick,
      icon: Icon,
      tooltip,
    }: {
      isActive?: boolean;
      onClick: () => void;
      icon: React.ComponentType<{ size?: number }>;
      tooltip: string;
    }) => (
      <button
        onClick={onClick}
        title={tooltip}
        className={`p-2 rounded-md transition-all duration-200 hover:bg-gray-100 ${
          isActive ? "bg-blue-100 text-blue-600 shadow-sm" : "text-gray-600"
        }`}
      >
        <Icon size={18} />
      </button>
    );

    return (
      <div
        className={`sticky top-0 z-10 bg-white border-b border-gray-200 p-4 transition-all duration-300 ${
          showToolbar ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
        }`}
      >
        <div className="flex flex-wrap items-center gap-3 max-w-6xl mx-auto">
          {/* Text Formatting */}
          <ButtonGroup>
            <ToolbarButton
              isActive={editor.isActive("bold")}
              onClick={() => editor.chain().focus().toggleBold().run()}
              icon={Bold}
              tooltip="Bold (Ctrl+B)"
            />
            <ToolbarButton
              isActive={editor.isActive("italic")}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              icon={Italic}
              tooltip="Italic (Ctrl+I)"
            />
            <ToolbarButton
              isActive={editor.isActive("underline")}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              icon={UnderlineIcon}
              tooltip="Underline (Ctrl+U)"
            />
          </ButtonGroup>

          {/* Headings */}
          <ButtonGroup>
            <ToolbarButton
              isActive={editor.isActive("heading", { level: 1 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              icon={Heading1}
              tooltip="Heading 1"
            />
            <ToolbarButton
              isActive={editor.isActive("heading", { level: 2 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              icon={Heading2}
              tooltip="Heading 2"
            />
          </ButtonGroup>

          {/* Lists */}
          <ButtonGroup>
            <ToolbarButton
              isActive={editor.isActive("bulletList")}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              icon={List}
              tooltip="Bullet List"
            />
            <ToolbarButton
              isActive={editor.isActive("orderedList")}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              icon={ListOrdered}
              tooltip="Numbered List"
            />
          </ButtonGroup>

          {/* Text Alignment */}
          <ButtonGroup>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              icon={AlignLeft}
              tooltip="Align Left"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign("center").run()}
              icon={AlignCenter}
              tooltip="Align Center"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              icon={AlignRight}
              tooltip="Align Right"
            />
          </ButtonGroup>

          {/* Other Formatting */}
          <ButtonGroup>
            <ToolbarButton
              isActive={editor.isActive("blockquote")}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              icon={Quote}
              tooltip="Quote"
            />
            <ToolbarButton
              isActive={editor.isActive("code")}
              onClick={() => editor.chain().focus().toggleCode().run()}
              icon={Code}
              tooltip="Inline Code"
            />
          </ButtonGroup>

          {/* History */}
          <ButtonGroup>
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              icon={Undo}
              tooltip="Undo (Ctrl+Z)"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              icon={Redo}
              tooltip="Redo (Ctrl+Y)"
            />
          </ButtonGroup>

          {/* Theme Switcher */}
          <div className="flex items-center space-x-2 ml-auto">
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as "light" | "dark" | "sepia")}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="light">☀️ Light</option>
              <option value="dark">🌙 Dark</option>
              <option value="sepia">📜 Sepia</option>
            </select>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${getThemeClasses()} ${
        isFullscreen ? "fixed inset-0 z-50" : ""
      }`}
    >
      {/* Header */}
      <div className={`border-b ${theme === "dark" ? "border-gray-700" : "border-gray-200"} p-4`}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <FileText className="text-blue-600" size={24} />
              <h1 className="text-xl font-semibold">Document Editor</h1>
            </div>

            <div className="flex items-center space-x-3">
              {lastSaved && (
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <Save size={16} />
                  <span>Saved {lastSaved.toLocaleTimeString()}</span>
                </div>
              )}

              <button
                onClick={() => setShowToolbar(!showToolbar)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title={showToolbar ? "Hide Toolbar" : "Show Toolbar"}
              >
                {showToolbar ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>

              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
              </button>

              {/* Download Menu */}
              <div className="relative group">
                <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Download size={16} />
                  <span>Download</span>
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <button
                    onClick={downloadDocument}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 rounded-t-lg flex items-center space-x-2"
                  >
                    <FileText size={16} />
                    <span>Download as HTML</span>
                  </button>
                  <button
                    onClick={downloadAsText}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 rounded-b-lg flex items-center space-x-2"
                  >
                    <Type size={16} />
                    <span>Download as Text</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Editable Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
            placeholder="Untitled Document"
            className={`w-full text-3xl font-bold border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none transition-colors py-2 bg-transparent ${
              theme === "dark" ? "placeholder-gray-400" : "placeholder-gray-500"
            }`}
          />

          {/* Document Info */}
          <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Clock size={14} />
                <span>Created {new Date(document.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Type size={14} />
                <span>{wordCount} words</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <MenuBar editor={editor} />

      {/* Editor */}
      <div className="max-w-6xl mx-auto p-6">
        <div className={`rounded-xl shadow-lg border-2 transition-all duration-300 ${getEditorThemeClasses()}`}>
          <EditorContent
            editor={editor}
            className="min-h-[600px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-opacity-50 rounded-xl transition-all duration-200"
          />
        </div>
      </div>

      {/* Footer Stats */}
      <div
        className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg ${
          theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-600"
        } border ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}
      >
        <div className="flex items-center space-x-4 text-sm">
          <span>{wordCount} words</span>
          <span>•</span>
          <span>{editor?.storage.characterCount?.characters() || 0} characters</span>
        </div>
      </div>
    </div>
  );
}
