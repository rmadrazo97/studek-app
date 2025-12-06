"use client";

import { motion } from "framer-motion";
import { Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface FocusRingProps {
  dueCards: number;
  newCards: number;
  reviewCards: number;
}

export function FocusRing({ dueCards, newCards, reviewCards }: FocusRingProps) {
  const totalCards = dueCards;
  const maxCards = 100; // For percentage calculation
  const percentage = Math.min((totalCards / maxCards) * 100, 100);
  const strokeDasharray = 2 * Math.PI * 88; // circumference
  const strokeDashoffset = strokeDasharray - (percentage / 100) * strokeDasharray;

  const hasCards = totalCards > 0;

  return (
    <div className="h-full flex flex-col items-center justify-center p-6">
      {/* Ring Container */}
      <div className="relative w-52 h-52 mb-6">
        {/* Background Ring */}
        <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r="88"
            fill="none"
            stroke="#27272a"
            strokeWidth="12"
          />
          {/* Progress Ring */}
          <motion.circle
            cx="100"
            cy="100"
            r="88"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="12"
            strokeLinecap="round"
            initial={{ strokeDashoffset: strokeDasharray }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{ strokeDasharray }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {hasCards ? (
            <>
              <motion.span
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-5xl font-bold text-zinc-100 font-display"
              >
                {totalCards}
              </motion.span>
              <span className="text-sm text-zinc-500 mt-1">cards due</span>
            </>
          ) : (
            <>
              <Sparkles className="w-10 h-10 text-emerald-400 mb-2" />
              <span className="text-lg font-medium text-zinc-100">All done!</span>
            </>
          )}
        </div>

        {/* Glow Effect */}
        {hasCards && (
          <div className="absolute inset-0 rounded-full bg-cyan-400/5 blur-xl animate-pulse" />
        )}
      </div>

      {/* Card Breakdown */}
      <div className="flex items-center gap-6 mb-6">
        <div className="text-center">
          <span className="block text-2xl font-bold text-blue-400">{newCards}</span>
          <span className="text-xs text-zinc-500">New</span>
        </div>
        <div className="w-px h-8 bg-zinc-800" />
        <div className="text-center">
          <span className="block text-2xl font-bold text-emerald-400">{reviewCards}</span>
          <span className="text-xs text-zinc-500">Review</span>
        </div>
      </div>

      {/* Action Button */}
      <Button
        variant="primary"
        size="lg"
        icon={hasCards ? <Play className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
        className="w-full max-w-xs"
      >
        {hasCards ? "Start Studying" : "Learn New Cards"}
      </Button>
    </div>
  );
}
