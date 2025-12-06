"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useReview, getNextIntervals } from "@/stores/reviewStore";

interface ReviewControlsProps {
  onFlip: () => void;
}

export function ReviewControls({ onFlip }: ReviewControlsProps) {
  const { state, flipCard, answerCard } = useReview();
  const { currentCard, status } = state;

  if (!currentCard) return null;

  const intervals = getNextIntervals(currentCard);

  const handleFlip = () => {
    flipCard();
    onFlip();
  };

  const handleAnswer = (rating: 1 | 2 | 3 | 4) => {
    answerCard(rating);
  };

  const ratingButtons = [
    {
      rating: 1 as const,
      label: "Again",
      interval: intervals.again,
      key: "1",
      color: "from-red-600 to-rose-600",
      hoverColor: "hover:from-red-500 hover:to-rose-500",
      textColor: "text-red-100",
      bgColor: "bg-red-950/50",
      borderColor: "border-red-800/50",
    },
    {
      rating: 2 as const,
      label: "Hard",
      interval: intervals.hard,
      key: "2",
      color: "from-orange-600 to-amber-600",
      hoverColor: "hover:from-orange-500 hover:to-amber-500",
      textColor: "text-orange-100",
      bgColor: "bg-orange-950/50",
      borderColor: "border-orange-800/50",
    },
    {
      rating: 3 as const,
      label: "Good",
      interval: intervals.good,
      key: "3 / Space",
      color: "from-emerald-600 to-green-600",
      hoverColor: "hover:from-emerald-500 hover:to-green-500",
      textColor: "text-emerald-100",
      bgColor: "bg-emerald-950/50",
      borderColor: "border-emerald-800/50",
      isDefault: true,
    },
    {
      rating: 4 as const,
      label: "Easy",
      interval: intervals.easy,
      key: "4",
      color: "from-blue-600 to-sky-600",
      hoverColor: "hover:from-blue-500 hover:to-sky-500",
      textColor: "text-blue-100",
      bgColor: "bg-blue-950/50",
      borderColor: "border-blue-800/50",
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      {/* Gradient fade */}
      <div className="h-20 bg-gradient-to-t from-black to-transparent pointer-events-none" />

      {/* Controls container */}
      <div className="bg-black pb-safe">
        <div className="max-w-2xl mx-auto px-4 pb-6">
          <AnimatePresence mode="wait">
            {status === "front" ? (
              /* Show Answer Button */
              <motion.div
                key="show-answer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <button
                  onClick={handleFlip}
                  className="w-full py-5 px-8 bg-gradient-to-r from-zinc-800 to-zinc-700 hover:from-zinc-700 hover:to-zinc-600 text-zinc-100 text-lg font-semibold rounded-2xl transition-all duration-200 active:scale-[0.98] border border-zinc-700"
                >
                  Show Answer
                  <span className="ml-2 text-sm text-zinc-400">Space</span>
                </button>
              </motion.div>
            ) : (
              /* Rating Buttons */
              <motion.div
                key="rating-buttons"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-4 gap-2 sm:gap-3"
              >
                {ratingButtons.map((btn, index) => (
                  <motion.button
                    key={btn.rating}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleAnswer(btn.rating)}
                    className={`
                      relative flex flex-col items-center justify-center
                      py-4 sm:py-5 px-2 rounded-2xl
                      ${btn.bgColor} border ${btn.borderColor}
                      transition-all duration-200
                      active:scale-[0.96]
                      group
                      ${btn.isDefault ? "ring-2 ring-emerald-500/50" : ""}
                    `}
                  >
                    {/* Gradient overlay on hover */}
                    <div
                      className={`
                        absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100
                        bg-gradient-to-br ${btn.color}
                        transition-opacity duration-200
                      `}
                    />

                    {/* Content */}
                    <div className="relative z-10">
                      <span className={`block text-sm sm:text-base font-semibold ${btn.textColor}`}>
                        {btn.label}
                      </span>
                      <span className="block text-xs text-zinc-400 mt-0.5 group-hover:text-zinc-300">
                        {btn.interval}
                      </span>
                    </div>

                    {/* Keyboard hint */}
                    <span className="absolute bottom-1 right-1 text-[10px] text-zinc-600 group-hover:text-zinc-400 hidden sm:block">
                      {btn.key}
                    </span>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile tap area for flip (invisible) */}
      {status === "front" && (
        <div
          onClick={handleFlip}
          className="fixed inset-x-0 bottom-0 h-[50vh] sm:hidden z-30"
          style={{ pointerEvents: "auto" }}
        />
      )}
    </div>
  );
}
