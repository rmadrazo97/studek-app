"use client";

import { useCallback, useEffect } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { Sparkles, FileEdit, Download } from "lucide-react";
import { AddDeckOption } from "./AddDeckOption";
import type { AddDeckSheetProps } from "./types";

export function AddDeckSheet({
  visible,
  onClose,
  onCreateWithAI,
  onCreateManual,
  onImportAnki,
}: AddDeckSheetProps) {
  const dragControls = useDragControls();

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && visible) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [visible, onClose]);

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [visible]);

  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { y: number }; velocity: { y: number } }) => {
      // Close if dragged down more than 100px or with high velocity
      if (info.offset.y > 100 || info.velocity.y > 500) {
        onClose();
      }
    },
    [onClose]
  );

  const handleOptionClick = useCallback(
    (action: () => void) => {
      onClose();
      // Small delay to let the sheet animate out
      setTimeout(action, 150);
    },
    [onClose]
  );

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a1a1a] rounded-t-3xl pb-[env(safe-area-inset-bottom,0px)]"
          >
            {/* Drag Indicator */}
            <div className="flex justify-center pt-3 pb-2">
              <div
                className="w-10 h-1 rounded-full bg-zinc-600 cursor-grab active:cursor-grabbing"
                onPointerDown={(e) => dragControls.start(e)}
              />
            </div>

            {/* Sheet Content */}
            <div className="px-5 pb-6">
              {/* Header */}
              <h2 className="text-lg font-semibold text-white mb-4">
                Create New Deck
              </h2>

              {/* Options */}
              <div className="space-y-3">
                <AddDeckOption
                  icon={<Sparkles className="w-6 h-6" />}
                  title="Create Deck with AI"
                  subtitle="Generate cards from documents or topics"
                  onPress={() => handleOptionClick(onCreateWithAI)}
                  isPrimary
                />

                <AddDeckOption
                  icon={<FileEdit className="w-6 h-6" />}
                  title="Create Manual Deck"
                  subtitle="Write your own cards from scratch"
                  onPress={() => handleOptionClick(onCreateManual)}
                />

                <AddDeckOption
                  icon={<Download className="w-6 h-6" />}
                  title="Import Anki Deck"
                  subtitle="Import .apkg files from Anki"
                  onPress={() => handleOptionClick(onImportAnki)}
                />
              </div>

              {/* Cancel Button */}
              <button
                onClick={onClose}
                className="w-full mt-4 py-3 text-zinc-400 text-sm font-medium hover:text-zinc-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
