"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ChevronLeft,
  Pencil,
  MoreHorizontal,
  Clock,
  Flag,
  Trash2,
  PauseCircle,
  Undo2,
} from "lucide-react";
import { useReview } from "@/stores/reviewStore";

interface ReviewHeaderProps {
  onEdit?: () => void;
  onUndo?: () => void;
}

export function ReviewHeader({ onEdit, onUndo }: ReviewHeaderProps) {
  const { state, undo } = useReview();
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showOptions, setShowOptions] = useState(false);

  const { newCount, learningCount, reviewCount, totalCount, completedCount, status } = state;
  const remaining = newCount + learningCount + reviewCount;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Timer logic
  useEffect(() => {
    if (status === "front" && state.startTime) {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - state.startTime!) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    } else if (status === "back") {
      // Stop timer when answer is shown
    }
  }, [status, state.startTime]);

  // Reset timer when card changes
  useEffect(() => {
    setElapsedTime(0);
  }, [state.currentCard?.id]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, "0")}` : `${secs}s`;
  };

  const isLeech = elapsedTime > 60;

  const handleUndo = () => {
    undo();
    onUndo?.();
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-xl border-b border-zinc-800/50 z-50">
      <div className="h-full max-w-4xl mx-auto px-4 flex items-center justify-between">
        {/* Left: Back Button */}
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition-colors p-2 -ml-2 rounded-lg hover:bg-zinc-800/50"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="hidden sm:inline text-sm font-medium">Dashboard</span>
          </Link>
        </div>

        {/* Center: Progress Pill */}
        <div className="flex-1 max-w-xs mx-4">
          <div className="relative">
            {/* Background track */}
            <div className="h-8 bg-zinc-900 rounded-full border border-zinc-800 overflow-hidden">
              {/* Progress segments */}
              <div className="h-full flex">
                {/* Completed section */}
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-500"
                />
              </div>

              {/* Labels overlay */}
              <div className="absolute inset-0 flex items-center justify-center gap-3 text-xs font-medium">
                {newCount > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-blue-400">{newCount}</span>
                  </span>
                )}
                {learningCount > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-orange-400" />
                    <span className="text-orange-400">{learningCount}</span>
                  </span>
                )}
                {reviewCount > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-emerald-400">{reviewCount}</span>
                  </span>
                )}
                {remaining === 0 && (
                  <span className="text-zinc-400">Complete!</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Utility Cluster */}
        <div className="flex items-center gap-1">
          {/* Timer */}
          <div
            className={`
              hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg
              ${isLeech ? "text-red-400 animate-pulse" : "text-zinc-500"}
              transition-colors
            `}
          >
            <Clock className="w-4 h-4" />
            <span className="text-sm font-mono">{formatTime(elapsedTime)}</span>
          </div>

          {/* Undo Button */}
          {state.history.length > 0 && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={handleUndo}
              className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 rounded-lg transition-colors"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-5 h-5" />
            </motion.button>
          )}

          {/* Edit Button */}
          <button
            onClick={onEdit}
            className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 rounded-lg transition-colors"
            title="Edit Card (E)"
          >
            <Pencil className="w-5 h-5" />
          </button>

          {/* More Options */}
          <div className="relative">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 rounded-lg transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {/* Dropdown */}
            {showOptions && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowOptions(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden z-50"
                >
                  <button
                    onClick={() => {
                      setShowOptions(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                  >
                    <PauseCircle className="w-4 h-4" />
                    Suspend Card
                  </button>
                  <button
                    onClick={() => {
                      setShowOptions(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                  >
                    <Flag className="w-4 h-4" />
                    Flag Card
                  </button>
                  <button
                    onClick={() => {
                      setShowOptions(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-zinc-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Card
                  </button>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
