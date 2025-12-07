"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  KeyboardEvent,
  memo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  GripVertical,
  Trash2,
  MoreHorizontal,
  Sparkles,
  BookOpen,
  Save,
} from "lucide-react";
import {
  Block,
  BlockType,
  useCreationStudio,
  createBlock,
  createFlashcardBlock,
  createQuizBlock,
} from "@/stores/creationStudioStore";
import { FlashcardBlock } from "./FlashcardBlock";
import { QuizBlock } from "./QuizBlock";
import { SlashCommandMenu } from "./SlashCommandMenu";
import { BubbleMenu } from "./BubbleMenu";
import { GhostText } from "./GhostText";

// Block component for each type
interface BlockRendererProps {
  block: Block;
  isActive: boolean;
  onFocus: () => void;
  onBlur: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLElement>) => void;
  onChange: (content: string) => void;
  onDelete: () => void;
  ghostText?: string;
}

const BlockRenderer = memo(function BlockRenderer({
  block,
  isActive,
  onFocus,
  onBlur,
  onKeyDown,
  onChange,
  onDelete,
  ghostText,
}: BlockRendererProps) {
  const inputRef = useRef<HTMLTextAreaElement | HTMLDivElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  const { openBubbleMenu } = useCreationStudio();

  // Auto-resize textarea
  const resizeTextarea = useCallback((element: HTMLTextAreaElement | null) => {
    if (element) {
      element.style.height = "auto";
      element.style.height = element.scrollHeight + "px";
    }
  }, []);

  useEffect(() => {
    if (inputRef.current && inputRef.current instanceof HTMLTextAreaElement) {
      resizeTextarea(inputRef.current);
    }
  }, [block.content, resizeTextarea]);

  // Handle text selection for bubble menu
  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      openBubbleMenu(rect.left + rect.width / 2, rect.top - 10);
    }
  }, [openBubbleMenu]);

  // Special block types
  if (block.type === "flashcard") {
    return <FlashcardBlock block={block} onDelete={onDelete} />;
  }

  if (block.type === "quiz") {
    return <QuizBlock block={block} onDelete={onDelete} />;
  }

  if (block.type === "divider") {
    return (
      <div className="group relative py-4">
        <div className="h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
        <button
          onClick={onDelete}
          className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded text-slate-500 hover:text-red-400 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Style mapping for block types
  const blockStyles: Record<BlockType, string> = {
    paragraph: "text-base text-slate-200",
    heading1: "text-3xl font-bold font-display text-white",
    heading2: "text-2xl font-semibold font-display text-white",
    heading3: "text-xl font-medium text-white",
    bulletList: "text-base text-slate-200 pl-6",
    numberedList: "text-base text-slate-200 pl-6",
    quote:
      "text-lg italic text-slate-300 border-l-4 border-cyan-500/50 pl-4 py-2",
    code: "font-mono text-sm text-emerald-300 bg-[rgba(0,0,0,0.4)] p-4 rounded-xl",
    callout:
      "text-base text-slate-200 bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl",
    flashcard: "",
    quiz: "",
    cloze: "text-base text-slate-200",
    divider: "",
  };

  const placeholders: Record<BlockType, string> = {
    paragraph: "Type '/' for commands, or start writing...",
    heading1: "Heading 1",
    heading2: "Heading 2",
    heading3: "Heading 3",
    bulletList: "List item",
    numberedList: "List item",
    quote: "Quote...",
    code: "// Code here...",
    callout: "Important note...",
    flashcard: "",
    quiz: "",
    cloze: "",
    divider: "",
  };

  return (
    <div
      className={`group relative flex items-start gap-2 py-1 ${
        isActive ? "z-10" : ""
      }`}
    >
      {/* Left controls (visible on hover) */}
      <div className="absolute -left-10 top-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-[rgba(148,163,184,0.1)] transition-all"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button className="p-1 rounded text-slate-500 hover:text-slate-300 cursor-grab active:cursor-grabbing">
          <GripVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Block content */}
      <div className="flex-1 min-w-0">
        {block.type === "code" ? (
          <pre
            className={`${blockStyles[block.type]} relative overflow-x-auto`}
          >
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={block.content}
              onChange={(e) => {
                onChange(e.target.value);
                resizeTextarea(e.target);
              }}
              onFocus={onFocus}
              onBlur={onBlur}
              onKeyDown={onKeyDown}
              placeholder={placeholders[block.type]}
              className="w-full bg-transparent resize-none focus:outline-none placeholder:text-slate-600 min-h-[60px]"
              spellCheck={false}
            />
            {ghostText && <GhostText text={ghostText} />}
          </pre>
        ) : block.type === "bulletList" || block.type === "numberedList" ? (
          <div className="flex items-start gap-3">
            <span className="text-slate-500 mt-1 select-none">
              {block.type === "bulletList" ? "•" : "1."}
            </span>
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={block.content}
              onChange={(e) => {
                onChange(e.target.value);
                resizeTextarea(e.target);
              }}
              onFocus={onFocus}
              onBlur={onBlur}
              onKeyDown={onKeyDown}
              onMouseUp={handleMouseUp}
              placeholder={placeholders[block.type]}
              className={`${blockStyles[block.type]} w-full bg-transparent resize-none focus:outline-none placeholder:text-slate-500 min-h-[28px]`}
              rows={1}
            />
            {ghostText && <GhostText text={ghostText} />}
          </div>
        ) : (
          <div className="relative">
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={block.content}
              onChange={(e) => {
                onChange(e.target.value);
                resizeTextarea(e.target);
              }}
              onFocus={onFocus}
              onBlur={onBlur}
              onKeyDown={onKeyDown}
              onMouseUp={handleMouseUp}
              placeholder={placeholders[block.type]}
              className={`${blockStyles[block.type]} w-full bg-transparent resize-none focus:outline-none placeholder:text-slate-500 min-h-[28px]`}
              rows={1}
            />
            {ghostText && <GhostText text={ghostText} />}
          </div>
        )}
      </div>

      {/* Right controls (visible on hover) */}
      <div className="absolute -right-8 top-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onDelete}
          className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
});

export function BlockEditor() {
  const {
    state,
    addBlock,
    updateBlock,
    deleteBlock,
    setFocusedBlock,
    openSlashMenu,
    closeBubbleMenu,
    acceptAISuggestion,
    rejectAISuggestion,
  } = useCreationStudio();

  const editorRef = useRef<HTMLDivElement>(null);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>, block: Block, index: number) => {
      // Slash command trigger
      if (e.key === "/" && block.content === "") {
        e.preventDefault();
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        openSlashMenu(rect.left, rect.bottom + 8);
        return;
      }

      // Enter to create new block
      if (e.key === "Enter" && !e.shiftKey) {
        if (block.type !== "code") {
          e.preventDefault();
          const newBlock = createBlock("paragraph", "");
          addBlock(newBlock, block.id);
        }
        return;
      }

      // Backspace on empty block to delete
      if (e.key === "Backspace" && block.content === "" && state.blocks.length > 1) {
        e.preventDefault();
        const prevBlock = state.blocks[index - 1];
        deleteBlock(block.id);
        if (prevBlock) {
          setFocusedBlock(prevBlock.id);
        }
        return;
      }

      // Tab for AI suggestion acceptance
      if (e.key === "Tab" && state.aiStream.isStreaming) {
        e.preventDefault();
        acceptAISuggestion();
        return;
      }

      // Escape to reject AI suggestion
      if (e.key === "Escape" && state.aiStream.isStreaming) {
        e.preventDefault();
        rejectAISuggestion();
        return;
      }

      // Arrow up to previous block
      if (e.key === "ArrowUp" && index > 0) {
        const textarea = e.target as HTMLTextAreaElement;
        if (textarea.selectionStart === 0) {
          e.preventDefault();
          setFocusedBlock(state.blocks[index - 1].id);
        }
        return;
      }

      // Arrow down to next block
      if (e.key === "ArrowDown" && index < state.blocks.length - 1) {
        const textarea = e.target as HTMLTextAreaElement;
        if (textarea.selectionStart === textarea.value.length) {
          e.preventDefault();
          setFocusedBlock(state.blocks[index + 1].id);
        }
        return;
      }

      // Undo/Redo
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        // These are handled by the store
        return;
      }
    },
    [state.blocks, state.aiStream.isStreaming, addBlock, deleteBlock, setFocusedBlock, openSlashMenu, acceptAISuggestion, rejectAISuggestion]
  );

  // Handle block content change
  const handleBlockChange = useCallback(
    (block: Block, content: string) => {
      updateBlock({ ...block, content });
    },
    [updateBlock]
  );

  // Handle bubble menu actions
  const handleBubbleAction = useCallback(
    (action: string, data?: Record<string, unknown>) => {
      const selectedText = (data?.text as string) || "";

      switch (action) {
        case "flashcard":
          addBlock(createFlashcardBlock(selectedText, ""));
          break;
        case "quiz":
          addBlock(createQuizBlock(selectedText));
          break;
        case "quote":
          addBlock(createBlock("quote", selectedText));
          break;
        // AI actions would trigger streaming
        case "ai-simplify":
        case "ai-expand":
        case "ai-ask":
          // These would trigger AI streaming in a real implementation
          break;
        default:
          break;
      }
      closeBubbleMenu();
    },
    [addBlock, closeBubbleMenu]
  );

  return (
    <div className="flex flex-col h-full bg-[#0d0e11]">
      {/* Editor header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(148,163,184,0.1)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <input
              type="text"
              defaultValue={state.documentTitle}
              className="text-lg font-semibold text-white bg-transparent focus:outline-none focus:ring-0 border-none"
              placeholder="Untitled Document"
            />
            <p className="text-xs text-slate-500">
              {state.blocks.length} blocks · Last saved just now
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-violet-400 hover:bg-violet-400/10 transition-colors">
            <Sparkles className="w-4 h-4" />
            <span>AI Assist</span>
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:bg-[rgba(148,163,184,0.1)] transition-colors">
            <Save className="w-4 h-4" />
            <span>Save</span>
          </button>
          <button className="p-2 rounded-lg text-slate-400 hover:bg-[rgba(148,163,184,0.1)] transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor content */}
      <div
        ref={editorRef}
        className="flex-1 overflow-y-auto px-6 py-8"
        onClick={() => closeBubbleMenu()}
      >
        <div className="max-w-3xl mx-auto pl-10 space-y-1">
          <AnimatePresence initial={false}>
            {state.blocks.map((block, index) => (
              <motion.div
                key={block.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <BlockRenderer
                  block={block}
                  isActive={activeBlockId === block.id}
                  onFocus={() => {
                    setActiveBlockId(block.id);
                    setFocusedBlock(block.id);
                  }}
                  onBlur={() => setActiveBlockId(null)}
                  onKeyDown={(e) => handleKeyDown(e, block, index)}
                  onChange={(content) => handleBlockChange(block, content)}
                  onDelete={() => deleteBlock(block.id)}
                  ghostText={
                    state.aiStream.isStreaming &&
                    state.aiStream.targetBlockId === block.id
                      ? state.aiStream.content
                      : undefined
                  }
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Add block button at the end */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => addBlock(createBlock("paragraph", ""))}
            className="group flex items-center gap-2 w-full py-4 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-sm opacity-0 group-hover:opacity-100 transition-opacity">
              Add a block
            </span>
          </motion.button>
        </div>
      </div>

      {/* Floating menus */}
      <SlashCommandMenu blockId={activeBlockId || undefined} />
      <BubbleMenu onAction={handleBubbleAction} />

      {/* AI streaming indicator */}
      <AnimatePresence>
        {state.aiStream.isStreaming && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 rounded-full bg-[#1a1d23] border border-violet-500/30 shadow-lg"
          >
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-sm text-slate-300">AI is writing...</span>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <kbd className="px-1.5 py-0.5 rounded bg-[rgba(148,163,184,0.1)]">Tab</kbd>
              <span>Accept</span>
              <kbd className="px-1.5 py-0.5 rounded bg-[rgba(148,163,184,0.1)]">Esc</kbd>
              <span>Cancel</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default BlockEditor;
