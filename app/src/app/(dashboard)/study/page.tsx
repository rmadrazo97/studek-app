"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { X, Loader2 } from "lucide-react";
import {
  ReviewProvider,
  useReview,
  Card,
} from "@/stores/reviewStore";
import { Button } from "@/components/ui/Button";
import { apiClient, ApiClientError } from "@/lib/api/client";
import { SessionSummary } from "@/components/study/SessionSummary";
import { scheduleReview } from "@/lib/fsrs";

interface DeckCard {
  id: string;
  deck_id: string;
  type: string;
  front: string;
  back: string;
  tags: string | string[] | null;
  fsrs?: {
    stability: number;
    difficulty: number;
    due: string;
    reps: number;
    lapses: number;
    state: string;
  };
}

interface DeckInfo {
  id: string;
  name: string;
}

interface DeckApiResponse {
  id: string;
  name: string;
}

interface CardsApiResponse {
  cards: DeckCard[];
}

interface SessionResult {
  session: {
    cardsReviewed: number;
    cardsCorrect: number;
    accuracy: number;
    bestCombo: number;
    avgTimeMs: number;
    totalDurationMs: number;
  };
  xp: {
    total: number;
    breakdown: {
      baseXP: number;
      newCardXP: number;
      comboXP: number;
      speedXP: number;
      difficultyXP: number;
      accuracyBonus: number;
      streakBonus: number;
    };
  };
  stats: {
    totalXP: number;
    dailyXP: number;
    dailyGoal: number;
    streak: number;
    longestStreak: number;
    streakIncreased: boolean;
    freezesAvailable: number;
  };
  level: {
    current: number;
    xpProgress: number;
    xpNeeded: number;
    progress: number;
    leveledUp: boolean;
  };
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    xpReward: number;
    rarity: "common" | "rare" | "epic" | "legendary";
  }>;
  message: string;
}

// Store card data for FSRS calculations
interface CardFSRSData {
  stability: number;
  difficulty: number;
  state: "new" | "learning" | "review" | "relearning";
  reps: number;
  lapses: number;
}

function StudyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deckId = searchParams.get("deckId");

  const { state, setQueue, flipCard, answerCard } = useReview();
  const { currentCard, status, isComplete, completedCount, totalCount, newCount, learningCount, reviewCount, history } = state;

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deckInfo, setDeckInfo] = useState<DeckInfo | null>(null);
  const [originalCards, setOriginalCards] = useState<Card[]>([]);
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Store FSRS data for each card
  const cardFSRSRef = useRef<Map<string, CardFSRSData>>(new Map());

  // Load cards from API
  useEffect(() => {
    async function loadCards() {
      if (!deckId) {
        setLoadError("No deck selected");
        setIsLoading(false);
        return;
      }

      try {
        // Fetch deck info
        const deckData = await apiClient.get<DeckApiResponse>(`/api/decks/${deckId}`);
        setDeckInfo({ id: deckData.id, name: deckData.name });

        // Fetch cards
        const cardsData = await apiClient.get<CardsApiResponse>(`/api/decks/${deckId}/cards`);

        // Transform cards to study format and store FSRS data
        const fsrsMap = new Map<string, CardFSRSData>();
        const studyCards: Card[] = cardsData.cards.map((card: DeckCard) => {
          const fsrsData: CardFSRSData = card.fsrs ? {
            stability: card.fsrs.stability,
            difficulty: card.fsrs.difficulty,
            state: (card.fsrs.state as CardFSRSData['state']) || 'new',
            reps: card.fsrs.reps,
            lapses: card.fsrs.lapses,
          } : {
            stability: 0,
            difficulty: 5.0,
            state: 'new' as const,
            reps: 0,
            lapses: 0,
          };

          fsrsMap.set(card.id, fsrsData);

          return {
            id: card.id,
            deckId: card.deck_id,
            deckName: deckData.name,
            front: card.front,
            back: card.back,
            type: card.type || "basic",
            fsrs: {
              stability: fsrsData.stability,
              difficulty: fsrsData.difficulty,
              due: card.fsrs?.due ? new Date(card.fsrs.due) : new Date(),
              reps: fsrsData.reps,
              lapses: fsrsData.lapses,
            },
            tags: Array.isArray(card.tags)
              ? card.tags
              : typeof card.tags === "string"
                ? JSON.parse(card.tags)
                : [],
          };
        });

        cardFSRSRef.current = fsrsMap;

        if (studyCards.length === 0) {
          setLoadError("This deck has no cards yet");
          setIsLoading(false);
          return;
        }

        setOriginalCards(studyCards);
        setQueue(studyCards);
        setIsLoading(false);
      } catch (err) {
        if (err instanceof ApiClientError && err.isUnauthorized) {
          setLoadError("Please log in to study this deck");
        } else {
          setLoadError(err instanceof Error ? err.message : "Failed to load cards");
        }
        setIsLoading(false);
      }
    }

    loadCards();
  }, [deckId, setQueue]);

  // Submit session when complete
  useEffect(() => {
    async function submitSession() {
      if (!isComplete || history.length === 0 || sessionResult || isSubmitting) return;

      setIsSubmitting(true);

      try {
        // Build review data with FSRS calculations
        const reviews = history.map((log) => {
          const fsrsData = cardFSRSRef.current.get(log.cardId);
          const isNewCard = fsrsData?.state === 'new';

          // Calculate new FSRS values using the algorithm
          const cardForSchedule = {
            difficulty: fsrsData?.difficulty || 5,
            stability: fsrsData?.stability || 0,
            retrievability: 1,
            due: new Date(),
            reps: fsrsData?.reps || 0,
            lapses: fsrsData?.lapses || 0,
            state: fsrsData?.state || 'new' as const,
          };

          const scheduled = scheduleReview(cardForSchedule, log.rating);

          return {
            cardId: log.cardId,
            rating: log.rating,
            durationMs: log.duration,
            stabilityBefore: fsrsData?.stability || 0,
            stabilityAfter: scheduled.card.stability,
            difficultyBefore: fsrsData?.difficulty || 5,
            difficultyAfter: scheduled.card.difficulty,
            isNewCard,
          };
        });

        const result = await apiClient.post<SessionResult>('/api/reviews/session', {
          deckId,
          reviews,
        });
        setSessionResult(result);
      } catch (error) {
        console.error('Error submitting session:', error);
        setSessionResult(createFallbackResult(history));
      } finally {
        setIsSubmitting(false);
      }
    }

    submitSession();
  }, [isComplete, history, sessionResult, isSubmitting, deckId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case " ":
        case "Enter":
          e.preventDefault();
          if (status === "front") {
            flipCard();
          } else {
            answerCard(3);
          }
          break;
        case "1":
          if (status === "back") answerCard(1);
          break;
        case "2":
          if (status === "back") answerCard(2);
          break;
        case "3":
          if (status === "back") answerCard(3);
          break;
        case "4":
          if (status === "back") answerCard(4);
          break;
        case "Escape":
          router.push("/dashboard");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [status, flipCard, answerCard, router]);

  // Parse content for code blocks
  const renderContent = useCallback((content: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <span key={lastIndex} className="whitespace-pre-wrap">
            {content.slice(lastIndex, match.index)}
          </span>
        );
      }

      const language = match[1] || "text";
      const code = match[2].trim();

      parts.push(
        <div key={`code-${match.index}`} className="my-4 text-left">
          <div className="text-[10px] text-zinc-600 mb-1 uppercase tracking-wider">{language}</div>
          <pre className="bg-zinc-950 border border-zinc-800/50 rounded-xl p-4 overflow-x-auto">
            <code className="text-sm font-mono text-zinc-300">{code}</code>
          </pre>
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push(
        <span key={lastIndex} className="whitespace-pre-wrap">
          {content.slice(lastIndex)}
        </span>
      );
    }

    return parts.length > 0 ? parts : content;
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Loading cards...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <X className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-zinc-100 mb-2">Cannot Start Study</h2>
          <p className="text-zinc-500 mb-6">{loadError}</p>
          <Button
            variant="primary"
            onClick={() => router.push("/library")}
          >
            Back to Library
          </Button>
        </div>
      </div>
    );
  }

  // Session complete - show enhanced summary
  if (isComplete && sessionResult) {
    return (
      <SessionSummary
        session={sessionResult.session}
        xp={sessionResult.xp}
        stats={sessionResult.stats}
        level={sessionResult.level}
        achievements={sessionResult.achievements}
        message={sessionResult.message}
        deckName={deckInfo?.name}
        onContinue={() => router.push("/library")}
        onStudyAgain={() => {
          setSessionResult(null);
          setQueue(originalCards);
        }}
      />
    );
  }

  // Session complete - loading/submitting
  if (isComplete && !sessionResult) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-violet-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Calculating your XP...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col select-none">
      {/* Minimal Header - Just counts and exit - with iOS safe area */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))]">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          {/* Close button */}
          <button
            onClick={() => router.push("/dashboard")}
            className="p-2 -ml-2 text-zinc-600 hover:text-zinc-400 transition-colors rounded-lg"
            aria-label="Exit study"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Progress counts - Anki style: new + learning + review */}
          <div className="flex items-center gap-1 text-sm font-medium">
            <span className="text-blue-400">{newCount}</span>
            <span className="text-zinc-700">+</span>
            <span className="text-orange-400">{learningCount}</span>
            <span className="text-zinc-700">+</span>
            <span className="text-emerald-400">{reviewCount}</span>
          </div>

          {/* Placeholder for symmetry */}
          <div className="w-9" />
        </div>
      </header>

      {/* Progress bar - ultra thin at top - account for iOS safe area */}
      <div className="fixed top-[env(safe-area-inset-top,0px)] left-0 right-0 h-0.5 bg-zinc-900 z-40">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
          transition={{ duration: 0.3 }}
          className="h-full bg-emerald-500"
        />
      </div>

      {/* Card Area */}
      <main
        className="flex-1 flex items-center justify-center px-4 py-20"
        onClick={() => status === "front" && flipCard()}
      >
        {currentCard && (
          <motion.div
            key={currentCard.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl"
          >
            {/* Question */}
            <div className="text-center mb-8">
              <div className="text-xl sm:text-2xl md:text-3xl font-medium text-zinc-100 leading-relaxed">
                {renderContent(currentCard.front)}
              </div>
            </div>

            {/* Answer */}
            <AnimatePresence>
              {status === "back" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                >
                  {/* Divider line */}
                  <div className="w-full h-px bg-zinc-800 mb-8" />

                  {/* Answer content */}
                  <div className="text-center text-xl sm:text-2xl md:text-3xl font-medium text-zinc-100 leading-relaxed">
                    {renderContent(currentCard.back)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      {/* Bottom Controls */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
        <div className="max-w-2xl mx-auto px-4 pb-6">
          <AnimatePresence mode="wait">
            {status === "front" ? (
              <motion.div
                key="show-answer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <button
                  onClick={flipCard}
                  className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 font-medium rounded-xl border border-zinc-800 transition-colors"
                >
                  Show Answer
                </button>
                <p className="text-center text-[11px] text-zinc-700 mt-2">
                  Space or tap anywhere
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="rating"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <RatingButtons onRate={answerCard} card={currentCard!} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </footer>
    </div>
  );
}

// Rating buttons component with intervals
function RatingButtons({
  onRate,
  card
}: {
  onRate: (rating: 1 | 2 | 3 | 4) => void;
  card: Card;
}) {
  // Simple interval calculation for display
  const getInterval = (rating: number) => {
    const stability = card.fsrs?.stability || 1;
    const difficulty = card.fsrs?.difficulty || 5;

    switch (rating) {
      case 1: return "<1m";
      case 2: return formatInterval(Math.max(1, stability * 0.5));
      case 3: return formatInterval(Math.max(1, stability * (1.5 - difficulty * 0.05)));
      case 4: return formatInterval(Math.max(1, stability * (2 - difficulty * 0.05)));
      default: return "";
    }
  };

  const formatInterval = (days: number) => {
    if (days < 1) return "<1d";
    if (days < 30) return `${Math.round(days)}d`;
    if (days < 365) return `${Math.round(days / 30)}mo`;
    return `${(days / 365).toFixed(1)}y`;
  };

  const buttons = [
    { rating: 1 as const, label: "Again", color: "text-red-400", bg: "bg-red-500/10 hover:bg-red-500/20 border-red-500/20" },
    { rating: 2 as const, label: "Hard", color: "text-orange-400", bg: "bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/20" },
    { rating: 3 as const, label: "Good", color: "text-emerald-400", bg: "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20", highlight: true },
    { rating: 4 as const, label: "Easy", color: "text-blue-400", bg: "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20" },
  ];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-2">
        {buttons.map((btn) => (
          <button
            key={btn.rating}
            onClick={() => onRate(btn.rating)}
            className={`
              py-3 px-2 rounded-xl border transition-colors
              ${btn.bg}
              ${btn.highlight ? "ring-1 ring-emerald-500/30" : ""}
            `}
          >
            <div className={`text-sm font-medium ${btn.color}`}>{btn.label}</div>
            <div className="text-[11px] text-zinc-600 mt-0.5">{getInterval(btn.rating)}</div>
          </button>
        ))}
      </div>
      <p className="text-center text-[11px] text-zinc-700">
        1, 2, 3, 4 or Space for Good
      </p>
    </div>
  );
}

// Create fallback result if API fails
function createFallbackResult(history: Array<{ cardId: string; rating: 1 | 2 | 3 | 4; duration: number }>): SessionResult {
  const cardsReviewed = history.length;
  const cardsCorrect = history.filter(h => h.rating > 1).length;
  const totalDurationMs = history.reduce((sum, h) => sum + h.duration, 0);

  return {
    session: {
      cardsReviewed,
      cardsCorrect,
      accuracy: cardsReviewed > 0 ? (cardsCorrect / cardsReviewed) * 100 : 0,
      bestCombo: 0,
      avgTimeMs: cardsReviewed > 0 ? totalDurationMs / cardsReviewed : 0,
      totalDurationMs,
    },
    xp: {
      total: cardsReviewed * 10 + cardsCorrect * 5,
      breakdown: {
        baseXP: cardsReviewed * 10,
        newCardXP: 0,
        comboXP: 0,
        speedXP: 0,
        difficultyXP: 0,
        accuracyBonus: 0,
        streakBonus: 0,
      },
    },
    stats: {
      totalXP: 0,
      dailyXP: cardsReviewed * 10 + cardsCorrect * 5,
      dailyGoal: 50,
      streak: 1,
      longestStreak: 1,
      streakIncreased: false,
      freezesAvailable: 1,
    },
    level: {
      current: 1,
      xpProgress: 0,
      xpNeeded: 100,
      progress: 0,
      leveledUp: false,
    },
    achievements: [],
    message: "Great work! Keep studying to unlock more features.",
  };
}

export default function StudyPage() {
  return (
    <ReviewProvider>
      <StudyContent />
    </ReviewProvider>
  );
}
