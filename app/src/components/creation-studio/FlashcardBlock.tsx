"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RotateCcw,
  Trash2,
  Link2,
  Sparkles,
  Check,
  ChevronDown,
  ChevronUp,
  GripVertical,
} from "lucide-react";
import { Block, useCreationStudio } from "@/stores/creationStudioStore";

interface FlashcardBlockProps {
  block: Block;
  isEditable?: boolean;
  onDelete?: () => void;
}

export function FlashcardBlock({
  block,
  isEditable = true,
  onDelete,
}: FlashcardBlockProps) {
  const { updateBlock, state } = useCreationStudio();
  const [isFlipped, setIsFlipped] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const frontRef = useRef<HTMLTextAreaElement>(null);
  const backRef = useRef<HTMLTextAreaElement>(null);

  const flashcard = block.flashcardData;
  if (!flashcard) return null;

  const handleFrontChange = useCallback(
    (value: string) => {
      updateBlock({
        ...block,
        flashcardData: {
          ...flashcard,
          front: value,
        },
      });
    },
    [block, flashcard, updateBlock]
  );

  const handleBackChange = useCallback(
    (value: string) => {
      updateBlock({
        ...block,
        flashcardData: {
          ...flashcard,
          back: value,
        },
      });
    },
    [block, flashcard, updateBlock]
  );

  // Auto-resize textareas
  const resizeTextarea = (textarea: HTMLTextAreaElement | null) => {
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
    }
  };

  useEffect(() => {
    resizeTextarea(frontRef.current);
    resizeTextarea(backRef.current);
  }, [flashcard.front, flashcard.back]);

  // Handle Tab to navigate between front and back
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, field: "front" | "back") => {
      if (e.key === "Tab" && !e.shiftKey && field === "front") {
        e.preventDefault();
        backRef.current?.focus();
      } else if (e.key === "Tab" && e.shiftKey && field === "back") {
        e.preventDefault();
        frontRef.current?.focus();
      }
    },
    []
  );

  const statusColors = {
    new: "from-blue-500/20 to-cyan-500/20 border-blue-500/30",
    learning: "from-amber-500/20 to-orange-500/20 border-amber-500/30",
    mastered: "from-emerald-500/20 to-green-500/20 border-emerald-500/30",
  };

  const statusLabels = {
    new: "New",
    learning: "Learning",
    mastered: "Mastered",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`
        group relative rounded-2xl overflow-hidden
        bg-gradient-to-br ${statusColors[flashcard.status]}
        border ${isFocused ? "border-cyan-400/50" : "border-[rgba(148,163,184,0.15)]"}
        transition-all duration-200
      `}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[rgba(0,0,0,0.2)]">
        <div className="flex items-center gap-3">
          {/* Drag handle */}
          <div className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity">
            <GripVertical className="w-4 h-4 text-slate-500" />
          </div>

          {/* Status badge */}
          <span
            className={`
            text-xs font-medium px-2 py-0.5 rounded-full
            ${flashcard.status === "new" ? "bg-blue-500/20 text-blue-300" : ""}
            ${flashcard.status === "learning" ? "bg-amber-500/20 text-amber-300" : ""}
            ${flashcard.status === "mastered" ? "bg-emerald-500/20 text-emerald-300" : ""}
          `}
          >
            {statusLabels[flashcard.status]}
          </span>

          {/* Source link indicator */}
          {block.sourceLink && (
            <button
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-cyan-400 transition-colors"
              title="Go to source"
            >
              <Link2 className="w-3 h-3" />
              <span>p.{block.sourceLink.page || 1}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* AI Generate button */}
          <button
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-violet-400 hover:bg-violet-400/10 transition-all"
            title="Generate with AI"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Flip preview */}
          <button
            onClick={() => setIsFlipped(!isFlipped)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 transition-all"
            title="Flip card"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Expand/Collapse */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[rgba(148,163,184,0.1)] transition-all"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {/* Delete */}
          {onDelete && (
            <button
              onClick={onDelete}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
              title="Delete flashcard"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Card content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* Flip animation container */}
              <div className="relative perspective-1000">
                <AnimatePresence mode="wait">
                  {!isFlipped ? (
                    <motion.div
                      key="front"
                      initial={{ rotateY: 180, opacity: 0 }}
                      animate={{ rotateY: 0, opacity: 1 }}
                      exit={{ rotateY: -180, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Front (Question) */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-cyan-400 uppercase tracking-wider">
                          Question
                        </label>
                        {isEditable ? (
                          <textarea
                            ref={frontRef}
                            value={flashcard.front}
                            onChange={(e) => handleFrontChange(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, "front")}
                            placeholder="Enter the question..."
                            className="w-full bg-[rgba(0,0,0,0.3)] rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-400/30 transition-all min-h-[60px]"
                            rows={2}
                          />
                        ) : (
                          <div className="bg-[rgba(0,0,0,0.3)] rounded-xl px-4 py-3 text-slate-100 min-h-[60px]">
                            {flashcard.front || "No question"}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="back"
                      initial={{ rotateY: -180, opacity: 0 }}
                      animate={{ rotateY: 0, opacity: 1 }}
                      exit={{ rotateY: 180, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Back (Answer) */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
                          Answer
                        </label>
                        {isEditable ? (
                          <textarea
                            ref={backRef}
                            value={flashcard.back}
                            onChange={(e) => handleBackChange(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, "back")}
                            placeholder="Enter the answer..."
                            className="w-full bg-[rgba(0,0,0,0.3)] rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400/30 transition-all min-h-[60px]"
                            rows={2}
                          />
                        ) : (
                          <div className="bg-[rgba(0,0,0,0.3)] rounded-xl px-4 py-3 text-slate-100 min-h-[60px]">
                            {flashcard.back || "No answer"}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Both sides visible in edit mode */}
              {isEditable && !isFlipped && (
                <div className="space-y-2 pt-2 border-t border-[rgba(148,163,184,0.1)]">
                  <label className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
                    Answer
                  </label>
                  <textarea
                    ref={backRef}
                    value={flashcard.back}
                    onChange={(e) => handleBackChange(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, "back")}
                    placeholder="Enter the answer..."
                    className="w-full bg-[rgba(0,0,0,0.3)] rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400/30 transition-all min-h-[60px]"
                    rows={2}
                  />
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div className="px-4 py-2 bg-[rgba(0,0,0,0.2)] text-xs text-slate-500 flex items-center justify-between">
              <span>Press Tab to switch between fields</span>
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3" />
                Auto-saved
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default FlashcardBlock;
