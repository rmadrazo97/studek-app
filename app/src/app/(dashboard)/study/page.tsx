"use client";

import { useEffect, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Trophy, ArrowRight, RotateCcw, X, Loader2 } from "lucide-react";
import {
  ReviewProvider,
  useReview,
  Card,
} from "@/stores/reviewStore";
import { Button } from "@/components/ui/Button";

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

function StudyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deckId = searchParams.get("deckId");

  const { state, setQueue, flipCard, answerCard } = useReview();
  const { currentCard, status, isComplete, completedCount, totalCount, newCount, learningCount, reviewCount } = state;

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deckInfo, setDeckInfo] = useState<DeckInfo | null>(null);
  const [originalCards, setOriginalCards] = useState<Card[]>([]);

  // Load cards from API
  useEffect(() => {
    async function loadCards() {
      if (!deckId) {
        setLoadError("No deck selected");
        setIsLoading(false);
        return;
      }

      try {
        // Fetch deck info with credentials
        const deckRes = await fetch(`/api/decks/${deckId}`, {
          credentials: 'include',
        });
        if (!deckRes.ok) {
          if (deckRes.status === 401) {
            throw new Error("Please log in to study this deck");
          }
          throw new Error("Failed to load deck");
        }
        const deckData = await deckRes.json();
        setDeckInfo({ id: deckData.id, name: deckData.name });

        // Fetch cards with credentials
        const cardsRes = await fetch(`/api/decks/${deckId}/cards`, {
          credentials: 'include',
        });
        if (!cardsRes.ok) throw new Error("Failed to load cards");
        const cardsData = await cardsRes.json();

        // Transform cards to study format
        const studyCards: Card[] = cardsData.cards.map((card: DeckCard) => ({
          id: card.id,
          deckId: card.deck_id,
          deckName: deckData.name,
          front: card.front,
          back: card.back,
          type: card.type || "basic",
          fsrs: card.fsrs ? {
            stability: card.fsrs.stability,
            difficulty: card.fsrs.difficulty,
            due: new Date(card.fsrs.due),
            reps: card.fsrs.reps,
            lapses: card.fsrs.lapses,
          } : {
            stability: 0,
            difficulty: 5.0,
            due: new Date(),
            reps: 0,
            lapses: 0,
          },
          tags: Array.isArray(card.tags)
            ? card.tags
            : typeof card.tags === "string"
              ? JSON.parse(card.tags)
              : [],
        }));

        if (studyCards.length === 0) {
          setLoadError("This deck has no cards yet");
          setIsLoading(false);
          return;
        }

        setOriginalCards(studyCards);
        setQueue(studyCards);
        setIsLoading(false);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Failed to load cards");
        setIsLoading(false);
      }
    }

    loadCards();
  }, [deckId, setQueue]);

  // Keyboard shortcuts - keep it simple like Anki
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case " ": // Space - show answer or rate Good
          e.preventDefault();
          if (status === "front") {
            flipCard();
          } else {
            answerCard(3);
          }
          break;
        case "Enter": // Enter - same as space
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

  // Completion screen
  if (isComplete) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center"
          >
            <Trophy className="w-10 h-10 text-white" />
          </motion.div>

          <h1 className="text-2xl font-bold text-zinc-100 mb-2">
            Congratulations!
          </h1>

          <p className="text-zinc-500 mb-8">
            {deckInfo ? `You have finished "${deckInfo.name}" for now.` : "You have finished this deck for now."}
          </p>

          {/* Simple stats */}
          <div className="mb-8 py-4 px-6 bg-zinc-900/50 rounded-xl inline-block">
            <span className="text-3xl font-bold text-emerald-400">{completedCount}</span>
            <span className="text-zinc-500 ml-2">cards studied</span>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              variant="primary"
              size="lg"
              icon={<ArrowRight className="w-5 h-5" />}
              iconPosition="right"
              onClick={() => router.push("/library")}
            >
              Back to Library
            </Button>
            <Button
              variant="ghost"
              size="lg"
              icon={<RotateCcw className="w-4 h-4" />}
              onClick={() => setQueue(originalCards)}
              className="text-zinc-500"
            >
              Study Again
            </Button>
          </div>
        </motion.div>
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

export default function StudyPage() {
  return (
    <ReviewProvider>
      <StudyContent />
    </ReviewProvider>
  );
}
