"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { useRouter } from "next/navigation";
import { Trophy, ArrowRight, RotateCcw } from "lucide-react";
import {
  ReviewProvider,
  useReview,
  Card,
} from "@/stores/reviewStore";
import {
  ReviewHeader,
  ReviewCard,
  ReviewControls,
  AITutorOverlay,
  AITutorButton,
} from "@/components/study";
import { Button } from "@/components/ui/Button";

// Sample cards for demonstration
const sampleCards: Card[] = [
  {
    id: "1",
    deckId: "med-anatomy",
    deckName: "Medicine::Anatomy::Heart",
    front: "What is the main function of the left ventricle?",
    back: "The left ventricle pumps oxygenated blood through the aorta to the rest of the body (systemic circulation).",
    type: "basic",
    fsrs: {
      stability: 4,
      difficulty: 5.2,
      due: new Date(),
      reps: 0,
      lapses: 0,
    },
    tags: ["cardiology", "anatomy"],
  },
  {
    id: "2",
    deckId: "med-anatomy",
    deckName: "Medicine::Anatomy::Heart",
    front: "What are the four chambers of the heart?",
    back: "1. Right Atrium\n2. Right Ventricle\n3. Left Atrium\n4. Left Ventricle",
    type: "basic",
    fsrs: {
      stability: 12,
      difficulty: 4.8,
      due: new Date(),
      reps: 5,
      lapses: 1,
    },
    tags: ["cardiology", "anatomy"],
  },
  {
    id: "3",
    deckId: "cs-algo",
    deckName: "Computer Science::Algorithms",
    front: "What is the time complexity of binary search?",
    back: "O(log n)\n\n```python\ndef binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1\n```",
    type: "basic",
    fsrs: {
      stability: 28,
      difficulty: 4.2,
      due: new Date(),
      reps: 12,
      lapses: 0,
    },
    tags: ["algorithms", "searching"],
  },
  {
    id: "4",
    deckId: "japanese",
    deckName: "Japanese::N3 Vocabulary",
    front: "経験 (けいけん)",
    back: "Experience",
    type: "basic",
    fsrs: {
      stability: 7,
      difficulty: 5.5,
      due: new Date(),
      reps: 3,
      lapses: 2,
    },
    tags: ["n3", "noun"],
  },
  {
    id: "5",
    deckId: "med-pharm",
    deckName: "Medicine::Pharmacology",
    front: "What is the mechanism of action of aspirin?",
    back: "Aspirin irreversibly inhibits cyclooxygenase (COX-1 and COX-2), reducing the synthesis of prostaglandins and thromboxanes.",
    type: "basic",
    fsrs: {
      stability: 2,
      difficulty: 6.1,
      due: new Date(),
      reps: 1,
      lapses: 1,
    },
    tags: ["pharmacology", "nsaids"],
  },
];

function StudyContent() {
  const router = useRouter();
  const { state, setQueue, flipCard, answerCard } = useReview();
  const { currentCard, status, isComplete, completedCount, totalCount } = state;
  const [isTutorOpen, setIsTutorOpen] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<string | null>(null);
  const constraintsRef = useRef(null);

  // Initialize queue
  useEffect(() => {
    setQueue(sampleCards);
  }, [setQueue]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if tutor is open or typing in input
      if (isTutorOpen) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case " ": // Space
          e.preventDefault();
          if (status === "front") {
            flipCard();
          } else {
            answerCard(3); // Good
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
        case "a":
        case "A":
          setIsTutorOpen(true);
          break;
        case "Escape":
          if (isTutorOpen) {
            setIsTutorOpen(false);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [status, flipCard, answerCard, isTutorOpen]);

  // Handle swipe gestures
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const threshold = 100;
      const velocity = 500;

      if (status === "front") {
        // Any swipe up or tap flips the card
        if (info.offset.y < -threshold || info.velocity.y < -velocity) {
          flipCard();
        }
      } else {
        // Swipe left = Again
        if (info.offset.x < -threshold || info.velocity.x < -velocity) {
          setSwipeDirection("left");
          setTimeout(() => {
            answerCard(1);
            setSwipeDirection(null);
          }, 150);
        }
        // Swipe right = Easy
        else if (info.offset.x > threshold || info.velocity.x > velocity) {
          setSwipeDirection("right");
          setTimeout(() => {
            answerCard(4);
            setSwipeDirection(null);
          }, 150);
        }
        // Swipe up = Good
        else if (info.offset.y < -threshold || info.velocity.y < -velocity) {
          setSwipeDirection("up");
          setTimeout(() => {
            answerCard(3);
            setSwipeDirection(null);
          }, 150);
        }
      }
    },
    [status, flipCard, answerCard]
  );

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
            className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center"
          >
            <Trophy className="w-12 h-12 text-white" />
          </motion.div>

          <h1 className="text-3xl font-bold font-display text-zinc-100 mb-4">
            Session Complete!
          </h1>

          <p className="text-zinc-400 mb-8">
            You reviewed <span className="text-cyan-400 font-semibold">{completedCount}</span> cards.
            Great work staying consistent!
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8 p-4 bg-zinc-900 rounded-2xl border border-zinc-800">
            <div>
              <span className="block text-2xl font-bold text-emerald-400">
                {Math.round((completedCount / totalCount) * 100)}%
              </span>
              <span className="text-xs text-zinc-500">Completed</span>
            </div>
            <div>
              <span className="block text-2xl font-bold text-cyan-400">
                {Math.round(state.history.reduce((acc, log) => acc + log.duration, 0) / 1000)}s
              </span>
              <span className="text-xs text-zinc-500">Total Time</span>
            </div>
            <div>
              <span className="block text-2xl font-bold text-violet-400">
                {state.history.filter((l) => l.rating >= 3).length}
              </span>
              <span className="text-xs text-zinc-500">Correct</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              variant="primary"
              size="lg"
              icon={<ArrowRight className="w-5 h-5" />}
              iconPosition="right"
              onClick={() => router.push("/dashboard")}
            >
              Back to Dashboard
            </Button>
            <Button
              variant="secondary"
              size="lg"
              icon={<RotateCcw className="w-5 h-5" />}
              onClick={() => setQueue(sampleCards)}
            >
              Study Again
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      ref={constraintsRef}
      className="min-h-screen bg-black flex flex-col"
    >
      {/* Header */}
      <ReviewHeader />

      {/* Main content area */}
      <div className="flex-1 flex items-center justify-center px-4 pt-20 pb-48">
        {currentCard && (
          <motion.div
            drag
            dragConstraints={constraintsRef}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            className="w-full cursor-grab active:cursor-grabbing"
          >
            <ReviewCard />
          </motion.div>
        )}
      </div>

      {/* Swipe feedback overlay */}
      <AnimatePresence>
        {swipeDirection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`
              fixed inset-0 pointer-events-none z-40
              ${swipeDirection === "left" ? "bg-red-500/20" : ""}
              ${swipeDirection === "right" ? "bg-blue-500/20" : ""}
              ${swipeDirection === "up" ? "bg-emerald-500/20" : ""}
            `}
          />
        )}
      </AnimatePresence>

      {/* Controls */}
      <ReviewControls onFlip={() => {}} />

      {/* AI Tutor Button */}
      {currentCard && !isTutorOpen && (
        <AITutorButton onClick={() => setIsTutorOpen(true)} />
      )}

      {/* AI Tutor Overlay */}
      <AITutorOverlay isOpen={isTutorOpen} onClose={() => setIsTutorOpen(false)} />
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
