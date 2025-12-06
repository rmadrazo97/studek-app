"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  ReactNode,
} from "react";

// Types for blocks in the editor
export type BlockType =
  | "paragraph"
  | "heading1"
  | "heading2"
  | "heading3"
  | "bulletList"
  | "numberedList"
  | "quote"
  | "code"
  | "flashcard"
  | "quiz"
  | "cloze"
  | "callout"
  | "divider";

export interface SourceLink {
  sourceId: string;
  page?: number;
  startOffset?: number;
  endOffset?: number;
  selectedText?: string;
}

export interface FlashcardData {
  front: string;
  back: string;
  status: "new" | "learning" | "mastered";
  lastReviewed?: Date;
}

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizData {
  question: string;
  options: QuizOption[];
  explanation?: string;
}

export interface ClozeData {
  text: string;
  clozes: { id: string; text: string; revealed: boolean }[];
}

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  sourceLink?: SourceLink;
  flashcardData?: FlashcardData;
  quizData?: QuizData;
  clozeData?: ClozeData;
  meta?: Record<string, unknown>;
}

export interface SourceDocument {
  id: string;
  type: "pdf" | "video" | "web" | "text";
  title: string;
  url?: string;
  content?: string;
  currentPage?: number;
  totalPages?: number;
  currentTime?: number;
  duration?: number;
}

// AI Streaming state
export interface AIStreamState {
  isStreaming: boolean;
  content: string;
  targetBlockId?: string;
  mode: "ghost" | "replace" | "append";
}

// Selection state
export interface SelectionState {
  text: string;
  blockId?: string;
  sourceId?: string;
  rect?: { x: number; y: number; width: number; height: number };
}

interface CreationStudioState {
  // Document state
  documentId: string;
  documentTitle: string;
  blocks: Block[];

  // Source state
  sourceDocument: SourceDocument | null;
  sourceSelection: SelectionState | null;

  // Editor state
  editorSelection: SelectionState | null;
  focusedBlockId: string | null;
  cursorPosition: number;

  // UI state
  paneSplitRatio: number;
  isSourceDrawerOpen: boolean;
  isMobile: boolean;
  isSlashMenuOpen: boolean;
  slashMenuPosition: { x: number; y: number };
  isBubbleMenuOpen: boolean;
  bubbleMenuPosition: { x: number; y: number };

  // AI state
  aiStream: AIStreamState;

  // History for undo/redo
  undoStack: Block[][];
  redoStack: Block[][];
}

type CreationStudioAction =
  | { type: "SET_DOCUMENT"; payload: { id: string; title: string; blocks: Block[] } }
  | { type: "SET_SOURCE"; payload: SourceDocument | null }
  | { type: "SET_SOURCE_SELECTION"; payload: SelectionState | null }
  | { type: "SET_EDITOR_SELECTION"; payload: SelectionState | null }
  | { type: "SET_FOCUSED_BLOCK"; payload: string | null }
  | { type: "SET_CURSOR_POSITION"; payload: number }
  | { type: "SET_PANE_RATIO"; payload: number }
  | { type: "TOGGLE_SOURCE_DRAWER" }
  | { type: "SET_MOBILE"; payload: boolean }
  | { type: "ADD_BLOCK"; payload: { block: Block; afterId?: string } }
  | { type: "UPDATE_BLOCK"; payload: Block }
  | { type: "DELETE_BLOCK"; payload: string }
  | { type: "MOVE_BLOCK"; payload: { id: string; direction: "up" | "down" } }
  | { type: "TRANSFORM_BLOCK"; payload: { id: string; newType: BlockType } }
  | { type: "OPEN_SLASH_MENU"; payload: { x: number; y: number } }
  | { type: "CLOSE_SLASH_MENU" }
  | { type: "OPEN_BUBBLE_MENU"; payload: { x: number; y: number } }
  | { type: "CLOSE_BUBBLE_MENU" }
  | { type: "START_AI_STREAM"; payload: { targetBlockId?: string; mode: "ghost" | "replace" | "append" } }
  | { type: "APPEND_AI_STREAM"; payload: string }
  | { type: "END_AI_STREAM" }
  | { type: "ACCEPT_AI_SUGGESTION" }
  | { type: "REJECT_AI_SUGGESTION" }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "SAVE_SNAPSHOT" };

// Generate unique ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// Create empty block
export function createBlock(type: BlockType = "paragraph", content: string = ""): Block {
  return {
    id: generateId(),
    type,
    content,
  };
}

// Create flashcard block
export function createFlashcardBlock(front: string = "", back: string = "", sourceLink?: SourceLink): Block {
  return {
    id: generateId(),
    type: "flashcard",
    content: "",
    sourceLink,
    flashcardData: {
      front,
      back,
      status: "new",
    },
  };
}

// Create quiz block
export function createQuizBlock(question: string = "", options: QuizOption[] = [], sourceLink?: SourceLink): Block {
  return {
    id: generateId(),
    type: "quiz",
    content: "",
    sourceLink,
    quizData: {
      question,
      options: options.length > 0 ? options : [
        { id: generateId(), text: "", isCorrect: true },
        { id: generateId(), text: "", isCorrect: false },
        { id: generateId(), text: "", isCorrect: false },
        { id: generateId(), text: "", isCorrect: false },
      ],
    },
  };
}

// Create cloze block
export function createClozeBlock(text: string, clozeTexts: string[] = []): Block {
  return {
    id: generateId(),
    type: "cloze",
    content: "",
    clozeData: {
      text,
      clozes: clozeTexts.map(t => ({ id: generateId(), text: t, revealed: false })),
    },
  };
}

// Initial state
const initialState: CreationStudioState = {
  documentId: generateId(),
  documentTitle: "Untitled Document",
  blocks: [createBlock("paragraph", "")],
  sourceDocument: null,
  sourceSelection: null,
  editorSelection: null,
  focusedBlockId: null,
  cursorPosition: 0,
  paneSplitRatio: 0.5,
  isSourceDrawerOpen: false,
  isMobile: false,
  isSlashMenuOpen: false,
  slashMenuPosition: { x: 0, y: 0 },
  isBubbleMenuOpen: false,
  bubbleMenuPosition: { x: 0, y: 0 },
  aiStream: {
    isStreaming: false,
    content: "",
    mode: "ghost",
  },
  undoStack: [],
  redoStack: [],
};

// Reducer
function creationStudioReducer(state: CreationStudioState, action: CreationStudioAction): CreationStudioState {
  switch (action.type) {
    case "SET_DOCUMENT":
      return {
        ...state,
        documentId: action.payload.id,
        documentTitle: action.payload.title,
        blocks: action.payload.blocks,
      };

    case "SET_SOURCE":
      return {
        ...state,
        sourceDocument: action.payload,
      };

    case "SET_SOURCE_SELECTION":
      return {
        ...state,
        sourceSelection: action.payload,
      };

    case "SET_EDITOR_SELECTION":
      return {
        ...state,
        editorSelection: action.payload,
      };

    case "SET_FOCUSED_BLOCK":
      return {
        ...state,
        focusedBlockId: action.payload,
      };

    case "SET_CURSOR_POSITION":
      return {
        ...state,
        cursorPosition: action.payload,
      };

    case "SET_PANE_RATIO":
      return {
        ...state,
        paneSplitRatio: Math.max(0.2, Math.min(0.8, action.payload)),
      };

    case "TOGGLE_SOURCE_DRAWER":
      return {
        ...state,
        isSourceDrawerOpen: !state.isSourceDrawerOpen,
      };

    case "SET_MOBILE":
      return {
        ...state,
        isMobile: action.payload,
        isSourceDrawerOpen: action.payload ? false : state.isSourceDrawerOpen,
      };

    case "ADD_BLOCK": {
      const { block, afterId } = action.payload;
      const blocks = [...state.blocks];
      const insertIndex = afterId
        ? blocks.findIndex(b => b.id === afterId) + 1
        : blocks.length;
      blocks.splice(insertIndex, 0, block);
      return {
        ...state,
        blocks,
        focusedBlockId: block.id,
        undoStack: [...state.undoStack, state.blocks],
        redoStack: [],
      };
    }

    case "UPDATE_BLOCK": {
      const blocks = state.blocks.map(b =>
        b.id === action.payload.id ? action.payload : b
      );
      return {
        ...state,
        blocks,
      };
    }

    case "DELETE_BLOCK": {
      if (state.blocks.length <= 1) return state;
      const blocks = state.blocks.filter(b => b.id !== action.payload);
      const deletedIndex = state.blocks.findIndex(b => b.id === action.payload);
      const newFocusId = blocks[Math.max(0, deletedIndex - 1)]?.id || null;
      return {
        ...state,
        blocks,
        focusedBlockId: newFocusId,
        undoStack: [...state.undoStack, state.blocks],
        redoStack: [],
      };
    }

    case "MOVE_BLOCK": {
      const { id, direction } = action.payload;
      const blocks = [...state.blocks];
      const index = blocks.findIndex(b => b.id === id);
      if (index === -1) return state;

      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= blocks.length) return state;

      [blocks[index], blocks[newIndex]] = [blocks[newIndex], blocks[index]];
      return {
        ...state,
        blocks,
        undoStack: [...state.undoStack, state.blocks],
        redoStack: [],
      };
    }

    case "TRANSFORM_BLOCK": {
      const { id, newType } = action.payload;
      const blocks = state.blocks.map(b => {
        if (b.id !== id) return b;

        const baseBlock: Block = {
          ...b,
          type: newType,
        };

        // Add specific data for special block types
        if (newType === "flashcard" && !b.flashcardData) {
          baseBlock.flashcardData = { front: b.content, back: "", status: "new" };
          baseBlock.content = "";
        }
        if (newType === "quiz" && !b.quizData) {
          baseBlock.quizData = {
            question: b.content,
            options: [
              { id: generateId(), text: "", isCorrect: true },
              { id: generateId(), text: "", isCorrect: false },
              { id: generateId(), text: "", isCorrect: false },
              { id: generateId(), text: "", isCorrect: false },
            ],
          };
          baseBlock.content = "";
        }

        return baseBlock;
      });
      return {
        ...state,
        blocks,
        undoStack: [...state.undoStack, state.blocks],
        redoStack: [],
      };
    }

    case "OPEN_SLASH_MENU":
      return {
        ...state,
        isSlashMenuOpen: true,
        slashMenuPosition: action.payload,
        isBubbleMenuOpen: false,
      };

    case "CLOSE_SLASH_MENU":
      return {
        ...state,
        isSlashMenuOpen: false,
      };

    case "OPEN_BUBBLE_MENU":
      return {
        ...state,
        isBubbleMenuOpen: true,
        bubbleMenuPosition: action.payload,
        isSlashMenuOpen: false,
      };

    case "CLOSE_BUBBLE_MENU":
      return {
        ...state,
        isBubbleMenuOpen: false,
      };

    case "START_AI_STREAM":
      return {
        ...state,
        aiStream: {
          isStreaming: true,
          content: "",
          targetBlockId: action.payload.targetBlockId,
          mode: action.payload.mode,
        },
      };

    case "APPEND_AI_STREAM":
      return {
        ...state,
        aiStream: {
          ...state.aiStream,
          content: state.aiStream.content + action.payload,
        },
      };

    case "END_AI_STREAM":
      return {
        ...state,
        aiStream: {
          ...state.aiStream,
          isStreaming: false,
        },
      };

    case "ACCEPT_AI_SUGGESTION": {
      if (!state.aiStream.content) return state;

      let blocks: Block[];
      if (state.aiStream.targetBlockId) {
        blocks = state.blocks.map(b => {
          if (b.id !== state.aiStream.targetBlockId) return b;
          if (state.aiStream.mode === "replace") {
            return { ...b, content: state.aiStream.content };
          } else {
            return { ...b, content: b.content + state.aiStream.content };
          }
        });
      } else {
        // Add as new block
        const newBlock = createBlock("paragraph", state.aiStream.content);
        blocks = [...state.blocks, newBlock];
      }

      return {
        ...state,
        blocks,
        aiStream: {
          isStreaming: false,
          content: "",
          mode: "ghost",
        },
        undoStack: [...state.undoStack, state.blocks],
        redoStack: [],
      };
    }

    case "REJECT_AI_SUGGESTION":
      return {
        ...state,
        aiStream: {
          isStreaming: false,
          content: "",
          mode: "ghost",
        },
      };

    case "UNDO": {
      if (state.undoStack.length === 0) return state;
      const previousBlocks = state.undoStack[state.undoStack.length - 1];
      return {
        ...state,
        blocks: previousBlocks,
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, state.blocks],
      };
    }

    case "REDO": {
      if (state.redoStack.length === 0) return state;
      const nextBlocks = state.redoStack[state.redoStack.length - 1];
      return {
        ...state,
        blocks: nextBlocks,
        redoStack: state.redoStack.slice(0, -1),
        undoStack: [...state.undoStack, state.blocks],
      };
    }

    case "SAVE_SNAPSHOT":
      return {
        ...state,
        undoStack: [...state.undoStack, state.blocks],
        redoStack: [],
      };

    default:
      return state;
  }
}

// Context
interface CreationStudioContextType {
  state: CreationStudioState;
  setDocument: (id: string, title: string, blocks: Block[]) => void;
  setSource: (source: SourceDocument | null) => void;
  setSourceSelection: (selection: SelectionState | null) => void;
  setEditorSelection: (selection: SelectionState | null) => void;
  setFocusedBlock: (id: string | null) => void;
  setCursorPosition: (position: number) => void;
  setPaneRatio: (ratio: number) => void;
  toggleSourceDrawer: () => void;
  setMobile: (isMobile: boolean) => void;
  addBlock: (block: Block, afterId?: string) => void;
  updateBlock: (block: Block) => void;
  deleteBlock: (id: string) => void;
  moveBlock: (id: string, direction: "up" | "down") => void;
  transformBlock: (id: string, newType: BlockType) => void;
  openSlashMenu: (x: number, y: number) => void;
  closeSlashMenu: () => void;
  openBubbleMenu: (x: number, y: number) => void;
  closeBubbleMenu: () => void;
  startAIStream: (targetBlockId?: string, mode?: "ghost" | "replace" | "append") => void;
  appendAIStream: (content: string) => void;
  endAIStream: () => void;
  acceptAISuggestion: () => void;
  rejectAISuggestion: () => void;
  undo: () => void;
  redo: () => void;
  saveSnapshot: () => void;
}

const CreationStudioContext = createContext<CreationStudioContextType | null>(null);

// Provider
export function CreationStudioProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(creationStudioReducer, initialState);

  const setDocument = useCallback((id: string, title: string, blocks: Block[]) => {
    dispatch({ type: "SET_DOCUMENT", payload: { id, title, blocks } });
  }, []);

  const setSource = useCallback((source: SourceDocument | null) => {
    dispatch({ type: "SET_SOURCE", payload: source });
  }, []);

  const setSourceSelection = useCallback((selection: SelectionState | null) => {
    dispatch({ type: "SET_SOURCE_SELECTION", payload: selection });
  }, []);

  const setEditorSelection = useCallback((selection: SelectionState | null) => {
    dispatch({ type: "SET_EDITOR_SELECTION", payload: selection });
  }, []);

  const setFocusedBlock = useCallback((id: string | null) => {
    dispatch({ type: "SET_FOCUSED_BLOCK", payload: id });
  }, []);

  const setCursorPosition = useCallback((position: number) => {
    dispatch({ type: "SET_CURSOR_POSITION", payload: position });
  }, []);

  const setPaneRatio = useCallback((ratio: number) => {
    dispatch({ type: "SET_PANE_RATIO", payload: ratio });
  }, []);

  const toggleSourceDrawer = useCallback(() => {
    dispatch({ type: "TOGGLE_SOURCE_DRAWER" });
  }, []);

  const setMobile = useCallback((isMobile: boolean) => {
    dispatch({ type: "SET_MOBILE", payload: isMobile });
  }, []);

  const addBlock = useCallback((block: Block, afterId?: string) => {
    dispatch({ type: "ADD_BLOCK", payload: { block, afterId } });
  }, []);

  const updateBlock = useCallback((block: Block) => {
    dispatch({ type: "UPDATE_BLOCK", payload: block });
  }, []);

  const deleteBlock = useCallback((id: string) => {
    dispatch({ type: "DELETE_BLOCK", payload: id });
  }, []);

  const moveBlock = useCallback((id: string, direction: "up" | "down") => {
    dispatch({ type: "MOVE_BLOCK", payload: { id, direction } });
  }, []);

  const transformBlock = useCallback((id: string, newType: BlockType) => {
    dispatch({ type: "TRANSFORM_BLOCK", payload: { id, newType } });
  }, []);

  const openSlashMenu = useCallback((x: number, y: number) => {
    dispatch({ type: "OPEN_SLASH_MENU", payload: { x, y } });
  }, []);

  const closeSlashMenu = useCallback(() => {
    dispatch({ type: "CLOSE_SLASH_MENU" });
  }, []);

  const openBubbleMenu = useCallback((x: number, y: number) => {
    dispatch({ type: "OPEN_BUBBLE_MENU", payload: { x, y } });
  }, []);

  const closeBubbleMenu = useCallback(() => {
    dispatch({ type: "CLOSE_BUBBLE_MENU" });
  }, []);

  const startAIStream = useCallback((targetBlockId?: string, mode: "ghost" | "replace" | "append" = "ghost") => {
    dispatch({ type: "START_AI_STREAM", payload: { targetBlockId, mode } });
  }, []);

  const appendAIStream = useCallback((content: string) => {
    dispatch({ type: "APPEND_AI_STREAM", payload: content });
  }, []);

  const endAIStream = useCallback(() => {
    dispatch({ type: "END_AI_STREAM" });
  }, []);

  const acceptAISuggestion = useCallback(() => {
    dispatch({ type: "ACCEPT_AI_SUGGESTION" });
  }, []);

  const rejectAISuggestion = useCallback(() => {
    dispatch({ type: "REJECT_AI_SUGGESTION" });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: "UNDO" });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: "REDO" });
  }, []);

  const saveSnapshot = useCallback(() => {
    dispatch({ type: "SAVE_SNAPSHOT" });
  }, []);

  return (
    <CreationStudioContext.Provider
      value={{
        state,
        setDocument,
        setSource,
        setSourceSelection,
        setEditorSelection,
        setFocusedBlock,
        setCursorPosition,
        setPaneRatio,
        toggleSourceDrawer,
        setMobile,
        addBlock,
        updateBlock,
        deleteBlock,
        moveBlock,
        transformBlock,
        openSlashMenu,
        closeSlashMenu,
        openBubbleMenu,
        closeBubbleMenu,
        startAIStream,
        appendAIStream,
        endAIStream,
        acceptAISuggestion,
        rejectAISuggestion,
        undo,
        redo,
        saveSnapshot,
      }}
    >
      {children}
    </CreationStudioContext.Provider>
  );
}

// Hook
export function useCreationStudio() {
  const context = useContext(CreationStudioContext);
  if (!context) {
    throw new Error("useCreationStudio must be used within a CreationStudioProvider");
  }
  return context;
}
