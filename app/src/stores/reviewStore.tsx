"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  ReactNode,
} from "react";

// Types
export interface Card {
  id: string;
  deckId: string;
  deckName: string;
  front: string;
  back: string;
  type: "basic" | "cloze" | "image-occlusion";
  media?: {
    type: "image" | "audio" | "video";
    url: string;
  };
  fsrs: {
    stability: number;
    difficulty: number;
    due: Date;
    lastReview?: Date;
    reps: number;
    lapses: number;
  };
  tags: string[];
}

export interface ReviewLog {
  cardId: string;
  rating: 1 | 2 | 3 | 4;
  duration: number;
  timestamp: Date;
}

export type CardStatus = "front" | "back";
export type CardType = "new" | "learning" | "review";

interface ReviewState {
  currentCard: Card | null;
  queue: Card[];
  newCount: number;
  learningCount: number;
  reviewCount: number;
  totalCount: number;
  completedCount: number;
  history: ReviewLog[];
  status: CardStatus;
  startTime: number | null;
  isComplete: boolean;
}

type ReviewAction =
  | { type: "SET_QUEUE"; payload: Card[] }
  | { type: "FLIP_CARD" }
  | { type: "ANSWER_CARD"; payload: { rating: 1 | 2 | 3 | 4; duration: number } }
  | { type: "UNDO" }
  | { type: "START_TIMER" }
  | { type: "RESET" };

// Calculate next intervals based on FSRS (simplified for UI display)
export function getNextIntervals(card: Card): { again: string; hard: string; good: string; easy: string } {
  const stability = card.fsrs.stability || 1;
  const difficulty = card.fsrs.difficulty || 5;

  // Simplified FSRS interval calculation for display
  const againInterval = "< 1m";
  const hardInterval = formatInterval(stability * 0.5);
  const goodInterval = formatInterval(stability * (1.3 - (difficulty - 5) * 0.02));
  const easyInterval = formatInterval(stability * (1.8 - (difficulty - 5) * 0.02));

  return { again: againInterval, hard: hardInterval, good: goodInterval, easy: easyInterval };
}

function formatInterval(days: number): string {
  if (days < 1) return "< 1d";
  if (days < 7) return `${Math.round(days)}d`;
  if (days < 30) return `${Math.round(days / 7)}w`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${Math.round(days / 365)}y`;
}

function getCardType(card: Card): CardType {
  if (card.fsrs.reps === 0) return "new";
  if (card.fsrs.stability < 21) return "learning";
  return "review";
}

// Initial state
const initialState: ReviewState = {
  currentCard: null,
  queue: [],
  newCount: 0,
  learningCount: 0,
  reviewCount: 0,
  totalCount: 0,
  completedCount: 0,
  history: [],
  status: "front",
  startTime: null,
  isComplete: false,
};

// Reducer
function reviewReducer(state: ReviewState, action: ReviewAction): ReviewState {
  switch (action.type) {
    case "SET_QUEUE": {
      const queue = action.payload;
      const newCount = queue.filter((c) => getCardType(c) === "new").length;
      const learningCount = queue.filter((c) => getCardType(c) === "learning").length;
      const reviewCount = queue.filter((c) => getCardType(c) === "review").length;

      return {
        ...state,
        queue: queue.slice(1),
        currentCard: queue[0] || null,
        newCount,
        learningCount,
        reviewCount,
        totalCount: queue.length,
        completedCount: 0,
        status: "front",
        startTime: Date.now(),
        isComplete: queue.length === 0,
      };
    }

    case "FLIP_CARD":
      return {
        ...state,
        status: "back",
      };

    case "ANSWER_CARD": {
      if (!state.currentCard) return state;

      const log: ReviewLog = {
        cardId: state.currentCard.id,
        rating: action.payload.rating,
        duration: action.payload.duration,
        timestamp: new Date(),
      };

      const cardType = getCardType(state.currentCard);
      const nextCard = state.queue[0] || null;

      return {
        ...state,
        currentCard: nextCard,
        queue: state.queue.slice(1),
        history: [...state.history, log],
        status: "front",
        startTime: nextCard ? Date.now() : null,
        completedCount: state.completedCount + 1,
        newCount: cardType === "new" ? state.newCount - 1 : state.newCount,
        learningCount: cardType === "learning" ? state.learningCount - 1 : state.learningCount,
        reviewCount: cardType === "review" ? state.reviewCount - 1 : state.reviewCount,
        isComplete: !nextCard,
      };
    }

    case "UNDO": {
      if (state.history.length === 0) return state;

      // This is a simplified undo - in production, we'd restore from server
      const newHistory = state.history.slice(0, -1);
      return {
        ...state,
        history: newHistory,
        completedCount: Math.max(0, state.completedCount - 1),
      };
    }

    case "START_TIMER":
      return {
        ...state,
        startTime: Date.now(),
      };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

// Context
interface ReviewContextType {
  state: ReviewState;
  setQueue: (cards: Card[]) => void;
  flipCard: () => void;
  answerCard: (rating: 1 | 2 | 3 | 4) => void;
  undo: () => void;
  reset: () => void;
}

const ReviewContext = createContext<ReviewContextType | null>(null);

// Provider
export function ReviewProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reviewReducer, initialState);

  const setQueue = useCallback((cards: Card[]) => {
    dispatch({ type: "SET_QUEUE", payload: cards });
  }, []);

  const flipCard = useCallback(() => {
    dispatch({ type: "FLIP_CARD" });
  }, []);

  const answerCard = useCallback((rating: 1 | 2 | 3 | 4) => {
    const duration = state.startTime ? Date.now() - state.startTime : 0;
    dispatch({ type: "ANSWER_CARD", payload: { rating, duration } });
  }, [state.startTime]);

  const undo = useCallback(() => {
    dispatch({ type: "UNDO" });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  return (
    <ReviewContext.Provider
      value={{ state, setQueue, flipCard, answerCard, undo, reset }}
    >
      {children}
    </ReviewContext.Provider>
  );
}

// Hook
export function useReview() {
  const context = useContext(ReviewContext);
  if (!context) {
    throw new Error("useReview must be used within a ReviewProvider");
  }
  return context;
}
