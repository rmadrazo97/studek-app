"use client";

import { useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bold,
  Italic,
  Underline,
  Link2,
  Highlighter,
  BookOpen,
  ClipboardList,
  Sparkles,
  ArrowRight,
  Copy,
  Wand2,
  Quote,
} from "lucide-react";
import { useCreationStudio } from "@/stores/creationStudioStore";

interface BubbleMenuProps {
  selectedText?: string;
  onAction?: (action: string, data?: Record<string, unknown>) => void;
}

export function BubbleMenu({ selectedText = "", onAction }: BubbleMenuProps) {
  const { state, closeBubbleMenu } = useCreationStudio();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeBubbleMenu();
      }
    };

    if (state.isBubbleMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [state.isBubbleMenuOpen, closeBubbleMenu]);

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeBubbleMenu();
      }
    };

    if (state.isBubbleMenuOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [state.isBubbleMenuOpen, closeBubbleMenu]);

  const handleAction = useCallback(
    (action: string, data?: Record<string, unknown>) => {
      onAction?.(action, data);
      closeBubbleMenu();
    },
    [onAction, closeBubbleMenu]
  );

  const handleCopy = useCallback(() => {
    if (selectedText) {
      navigator.clipboard.writeText(selectedText);
      handleAction("copy");
    }
  }, [selectedText, handleAction]);

  if (!state.isBubbleMenuOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="fixed z-50"
        style={{
          left: state.bubbleMenuPosition.x,
          top: state.bubbleMenuPosition.y,
          transform: "translate(-50%, -100%)",
        }}
      >
        <div className="flex flex-col gap-1 p-1.5 rounded-xl bg-[#1a1d23] border border-[rgba(148,163,184,0.2)] shadow-xl">
          {/* Main formatting row */}
          <div className="flex items-center gap-0.5">
            {/* Text formatting */}
            <button
              onClick={() => handleAction("bold")}
              className="p-2 rounded-lg text-slate-300 hover:bg-[rgba(148,163,184,0.1)] hover:text-white transition-colors"
              title="Bold (Cmd+B)"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleAction("italic")}
              className="p-2 rounded-lg text-slate-300 hover:bg-[rgba(148,163,184,0.1)] hover:text-white transition-colors"
              title="Italic (Cmd+I)"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleAction("underline")}
              className="p-2 rounded-lg text-slate-300 hover:bg-[rgba(148,163,184,0.1)] hover:text-white transition-colors"
              title="Underline (Cmd+U)"
            >
              <Underline className="w-4 h-4" />
            </button>

            <div className="w-px h-5 bg-[rgba(148,163,184,0.2)] mx-0.5" />

            {/* Link and highlight */}
            <button
              onClick={() => handleAction("link")}
              className="p-2 rounded-lg text-slate-300 hover:bg-[rgba(148,163,184,0.1)] hover:text-white transition-colors"
              title="Add link"
            >
              <Link2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleAction("highlight")}
              className="p-2 rounded-lg text-slate-300 hover:bg-cyan-400/10 hover:text-cyan-400 transition-colors"
              title="Highlight"
            >
              <Highlighter className="w-4 h-4" />
            </button>

            <div className="w-px h-5 bg-[rgba(148,163,184,0.2)] mx-0.5" />

            {/* Copy */}
            <button
              onClick={handleCopy}
              className="p-2 rounded-lg text-slate-300 hover:bg-[rgba(148,163,184,0.1)] hover:text-white transition-colors"
              title="Copy"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>

          {/* Magic actions row */}
          <div className="flex items-center gap-0.5 pt-1 border-t border-[rgba(148,163,184,0.1)]">
            {/* Create flashcard */}
            <button
              onClick={() => handleAction("flashcard", { text: selectedText })}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-cyan-400 hover:bg-cyan-400/10 transition-colors"
              title="Create Flashcard"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Flashcard</span>
            </button>

            {/* Create quiz */}
            <button
              onClick={() => handleAction("quiz", { text: selectedText })}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-violet-400 hover:bg-violet-400/10 transition-colors"
              title="Create Quiz"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Quiz</span>
            </button>

            {/* Make quote */}
            <button
              onClick={() => handleAction("quote", { text: selectedText })}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-slate-300 hover:bg-[rgba(148,163,184,0.1)] hover:text-white transition-colors"
              title="Make Quote"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* AI actions row */}
          <div className="flex items-center gap-0.5 pt-1 border-t border-[rgba(148,163,184,0.1)]">
            <button
              onClick={() => handleAction("ai-simplify", { text: selectedText })}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-slate-300 hover:bg-violet-400/10 hover:text-violet-400 transition-colors"
              title="Simplify with AI"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Simplify</span>
            </button>

            <button
              onClick={() => handleAction("ai-expand", { text: selectedText })}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-slate-300 hover:bg-violet-400/10 hover:text-violet-400 transition-colors"
              title="Expand with AI"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Expand</span>
            </button>

            <button
              onClick={() => handleAction("ai-ask", { text: selectedText })}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-violet-400 hover:bg-violet-400/10 transition-colors"
              title="Ask AI about this"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask AI</span>
            </button>
          </div>
        </div>

        {/* Arrow pointer */}
        <div
          className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-3 h-3 rotate-45 bg-[#1a1d23] border-r border-b border-[rgba(148,163,184,0.2)]"
        />
      </motion.div>
    </AnimatePresence>
  );
}

export default BubbleMenu;
