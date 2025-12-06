"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
  AlertCircle,
  BookOpen,
  ClipboardList,
  FileText,
  Sparkles,
  MessageSquare,
  Lightbulb,
  Zap,
} from "lucide-react";
import {
  BlockType,
  useCreationStudio,
  createBlock,
  createFlashcardBlock,
  createQuizBlock,
} from "@/stores/creationStudioStore";

interface CommandItem {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: "basic" | "magic" | "ai";
  action: () => void;
  keywords?: string[];
}

interface SlashCommandMenuProps {
  blockId?: string;
}

export function SlashCommandMenu({ blockId }: SlashCommandMenuProps) {
  const { state, closeSlashMenu, addBlock, transformBlock } = useCreationStudio();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when menu opens
  useEffect(() => {
    if (state.isSlashMenuOpen) {
      inputRef.current?.focus();
      setSearchQuery("");
      setSelectedIndex(0);
    }
  }, [state.isSlashMenuOpen]);

  // Command items
  const commands: CommandItem[] = [
    // Basic blocks
    {
      id: "paragraph",
      label: "Text",
      description: "Plain text paragraph",
      icon: <Type className="w-4 h-4" />,
      category: "basic",
      action: () => {
        if (blockId) {
          transformBlock(blockId, "paragraph");
        } else {
          addBlock(createBlock("paragraph", ""));
        }
        closeSlashMenu();
      },
      keywords: ["text", "paragraph", "p"],
    },
    {
      id: "heading1",
      label: "Heading 1",
      description: "Large section heading",
      icon: <Heading1 className="w-4 h-4" />,
      category: "basic",
      action: () => {
        if (blockId) {
          transformBlock(blockId, "heading1");
        } else {
          addBlock(createBlock("heading1", ""));
        }
        closeSlashMenu();
      },
      keywords: ["h1", "heading", "title"],
    },
    {
      id: "heading2",
      label: "Heading 2",
      description: "Medium section heading",
      icon: <Heading2 className="w-4 h-4" />,
      category: "basic",
      action: () => {
        if (blockId) {
          transformBlock(blockId, "heading2");
        } else {
          addBlock(createBlock("heading2", ""));
        }
        closeSlashMenu();
      },
      keywords: ["h2", "heading", "subtitle"],
    },
    {
      id: "heading3",
      label: "Heading 3",
      description: "Small section heading",
      icon: <Heading3 className="w-4 h-4" />,
      category: "basic",
      action: () => {
        if (blockId) {
          transformBlock(blockId, "heading3");
        } else {
          addBlock(createBlock("heading3", ""));
        }
        closeSlashMenu();
      },
      keywords: ["h3", "heading"],
    },
    {
      id: "bulletList",
      label: "Bullet List",
      description: "Unordered list",
      icon: <List className="w-4 h-4" />,
      category: "basic",
      action: () => {
        if (blockId) {
          transformBlock(blockId, "bulletList");
        } else {
          addBlock(createBlock("bulletList", ""));
        }
        closeSlashMenu();
      },
      keywords: ["ul", "bullets", "list"],
    },
    {
      id: "numberedList",
      label: "Numbered List",
      description: "Ordered list",
      icon: <ListOrdered className="w-4 h-4" />,
      category: "basic",
      action: () => {
        if (blockId) {
          transformBlock(blockId, "numberedList");
        } else {
          addBlock(createBlock("numberedList", ""));
        }
        closeSlashMenu();
      },
      keywords: ["ol", "numbers", "ordered"],
    },
    {
      id: "quote",
      label: "Quote",
      description: "Block quote",
      icon: <Quote className="w-4 h-4" />,
      category: "basic",
      action: () => {
        if (blockId) {
          transformBlock(blockId, "quote");
        } else {
          addBlock(createBlock("quote", ""));
        }
        closeSlashMenu();
      },
      keywords: ["blockquote", "citation"],
    },
    {
      id: "code",
      label: "Code Block",
      description: "Code with syntax highlighting",
      icon: <Code className="w-4 h-4" />,
      category: "basic",
      action: () => {
        if (blockId) {
          transformBlock(blockId, "code");
        } else {
          addBlock(createBlock("code", ""));
        }
        closeSlashMenu();
      },
      keywords: ["code", "snippet", "programming"],
    },
    {
      id: "divider",
      label: "Divider",
      description: "Horizontal line",
      icon: <Minus className="w-4 h-4" />,
      category: "basic",
      action: () => {
        addBlock(createBlock("divider", ""));
        closeSlashMenu();
      },
      keywords: ["hr", "line", "separator"],
    },
    {
      id: "callout",
      label: "Callout",
      description: "Highlighted info box",
      icon: <AlertCircle className="w-4 h-4" />,
      category: "basic",
      action: () => {
        if (blockId) {
          transformBlock(blockId, "callout");
        } else {
          addBlock(createBlock("callout", ""));
        }
        closeSlashMenu();
      },
      keywords: ["info", "note", "warning", "alert"],
    },
    // Magic blocks
    {
      id: "flashcard",
      label: "Flashcard",
      description: "Create a study flashcard",
      icon: <BookOpen className="w-4 h-4 text-cyan-400" />,
      category: "magic",
      action: () => {
        addBlock(createFlashcardBlock("", "", state.sourceSelection ? {
          sourceId: state.sourceDocument?.id || "",
          selectedText: state.sourceSelection.text,
        } : undefined), blockId);
        closeSlashMenu();
      },
      keywords: ["card", "anki", "study", "memorize"],
    },
    {
      id: "quiz",
      label: "Quiz",
      description: "Create a multiple choice quiz",
      icon: <ClipboardList className="w-4 h-4 text-violet-400" />,
      category: "magic",
      action: () => {
        addBlock(createQuizBlock("", [], state.sourceSelection ? {
          sourceId: state.sourceDocument?.id || "",
          selectedText: state.sourceSelection.text,
        } : undefined), blockId);
        closeSlashMenu();
      },
      keywords: ["question", "test", "mcq", "multiple choice"],
    },
    {
      id: "summary",
      label: "Summary Block",
      description: "Add a key takeaway",
      icon: <FileText className="w-4 h-4 text-emerald-400" />,
      category: "magic",
      action: () => {
        addBlock(createBlock("callout", "Key Takeaway: "), blockId);
        closeSlashMenu();
      },
      keywords: ["takeaway", "key point", "important"],
    },
    // AI commands
    {
      id: "ai-generate",
      label: "Ask AI",
      description: "Generate content with AI",
      icon: <Sparkles className="w-4 h-4 text-violet-400" />,
      category: "ai",
      action: () => {
        // This will trigger AI sidebar or inline generation
        closeSlashMenu();
      },
      keywords: ["gpt", "generate", "write", "create"],
    },
    {
      id: "ai-summarize",
      label: "Summarize",
      description: "Summarize selected content",
      icon: <MessageSquare className="w-4 h-4 text-violet-400" />,
      category: "ai",
      action: () => {
        closeSlashMenu();
      },
      keywords: ["tldr", "shorten", "brief"],
    },
    {
      id: "ai-explain",
      label: "Explain",
      description: "Get a simpler explanation",
      icon: <Lightbulb className="w-4 h-4 text-amber-400" />,
      category: "ai",
      action: () => {
        closeSlashMenu();
      },
      keywords: ["simplify", "clarify", "eli5"],
    },
    {
      id: "ai-flashcards",
      label: "Generate Flashcards",
      description: "AI creates flashcards from source",
      icon: <Zap className="w-4 h-4 text-cyan-400" />,
      category: "ai",
      action: () => {
        closeSlashMenu();
      },
      keywords: ["auto", "bulk", "cards"],
    },
  ];

  // Filter commands based on search
  const filteredCommands = commands.filter((cmd) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(query) ||
      cmd.description.toLowerCase().includes(query) ||
      cmd.keywords?.some((k) => k.includes(query))
    );
  });

  // Group by category
  const groupedCommands = {
    basic: filteredCommands.filter((c) => c.category === "basic"),
    magic: filteredCommands.filter((c) => c.category === "magic"),
    ai: filteredCommands.filter((c) => c.category === "ai"),
  };

  // Flatten for keyboard navigation
  const flatCommands = [...groupedCommands.basic, ...groupedCommands.magic, ...groupedCommands.ai];

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, flatCommands.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (flatCommands[selectedIndex]) {
            flatCommands[selectedIndex].action();
          }
          break;
        case "Escape":
          e.preventDefault();
          closeSlashMenu();
          break;
      }
    },
    [flatCommands, selectedIndex, closeSlashMenu]
  );

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeSlashMenu();
      }
    };

    if (state.isSlashMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [state.isSlashMenuOpen, closeSlashMenu]);

  if (!state.isSlashMenuOpen) return null;

  const renderCategory = (title: string, items: CommandItem[], startIndex: number) => {
    if (items.length === 0) return null;

    return (
      <div key={title}>
        <div className="px-3 py-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider">
          {title}
        </div>
        {items.map((cmd, idx) => {
          const globalIndex = startIndex + idx;
          const isSelected = globalIndex === selectedIndex;

          return (
            <button
              key={cmd.id}
              onClick={cmd.action}
              onMouseEnter={() => setSelectedIndex(globalIndex)}
              className={`
                w-full flex items-center gap-3 px-3 py-2 text-left transition-colors
                ${isSelected ? "bg-[rgba(148,163,184,0.1)]" : "hover:bg-[rgba(148,163,184,0.05)]"}
              `}
            >
              <div
                className={`
                  w-8 h-8 rounded-lg flex items-center justify-center
                  ${isSelected ? "bg-cyan-500/20 text-cyan-400" : "bg-[rgba(148,163,184,0.1)] text-slate-400"}
                `}
              >
                {cmd.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${isSelected ? "text-white" : "text-slate-200"}`}>
                  {cmd.label}
                </div>
                <div className="text-xs text-slate-500 truncate">{cmd.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="fixed z-50 w-72 max-h-96 overflow-hidden rounded-xl bg-[#1a1d23] border border-[rgba(148,163,184,0.15)] shadow-2xl"
        style={{
          left: state.slashMenuPosition.x,
          top: state.slashMenuPosition.y,
        }}
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="p-2 border-b border-[rgba(148,163,184,0.1)]">
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search commands..."
            className="w-full px-3 py-2 bg-[rgba(0,0,0,0.3)] rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
          />
        </div>

        {/* Commands list */}
        <div className="overflow-y-auto max-h-72 py-1">
          {flatCommands.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-slate-500">
              No commands found
            </div>
          ) : (
            <>
              {renderCategory("Basic Blocks", groupedCommands.basic, 0)}
              {renderCategory("Magic Blocks", groupedCommands.magic, groupedCommands.basic.length)}
              {renderCategory("AI Commands", groupedCommands.ai, groupedCommands.basic.length + groupedCommands.magic.length)}
            </>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-3 py-2 border-t border-[rgba(148,163,184,0.1)] flex items-center justify-between text-xs text-slate-500">
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>Esc Close</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default SlashCommandMenu;
