"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Folder, Globe, Lock, ChevronDown } from "lucide-react";
import { DECK_CATEGORIES, type DeckCategory } from "@/lib/db/types";

// Category display names
const categoryLabels: Record<DeckCategory, string> = {
  languages: "Languages",
  medicine: "Medicine",
  science: "Science",
  mathematics: "Mathematics",
  history: "History",
  geography: "Geography",
  programming: "Programming",
  business: "Business",
  law: "Law",
  arts: "Arts",
  music: "Music",
  literature: "Literature",
  philosophy: "Philosophy",
  psychology: "Psychology",
  "test-prep": "Test Prep",
  other: "Other",
};

interface CreateDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: {
    name: string;
    description?: string;
    category?: DeckCategory;
    is_public?: boolean;
  }) => Promise<void>;
}

export default function CreateDeckModal({
  isOpen,
  onClose,
  onCreate,
}: CreateDeckModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<DeckCategory | "">("");
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!name.trim()) {
        setError("Deck name is required");
        return;
      }

      // If public, category is required
      if (isPublic && !category) {
        setError("Please select a category for public decks");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        await onCreate({
          name: name.trim(),
          description: description.trim() || undefined,
          category: category || undefined,
          is_public: isPublic,
        });

        // Reset form
        setName("");
        setDescription("");
        setCategory("");
        setIsPublic(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create deck");
      } finally {
        setIsLoading(false);
      }
    },
    [name, description, category, isPublic, onCreate]
  );

  const handleClose = useCallback(() => {
    if (!isLoading) {
      setName("");
      setDescription("");
      setCategory("");
      setIsPublic(false);
      setError(null);
      onClose();
    }
  }, [isLoading, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-background-secondary rounded-xl border border-white/10 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-lg">
                  <Folder className="w-5 h-5 text-cyan-400" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">
                  Create New Deck
                </h2>
              </div>
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label
                  htmlFor="deck-name"
                  className="block text-sm font-medium text-gray-300 mb-1.5"
                >
                  Name
                </label>
                <input
                  id="deck-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Medical Biochemistry"
                  className="w-full px-4 py-2.5 bg-background text-foreground placeholder-gray-500 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="deck-description"
                  className="block text-sm font-medium text-gray-300 mb-1.5"
                >
                  Description <span className="text-gray-500">(optional)</span>
                </label>
                <textarea
                  id="deck-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the deck content..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-background text-foreground placeholder-gray-500 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all resize-none"
                  disabled={isLoading}
                />
              </div>

              {/* Category */}
              <div>
                <label
                  htmlFor="deck-category"
                  className="block text-sm font-medium text-gray-300 mb-1.5"
                >
                  Category{" "}
                  {isPublic ? (
                    <span className="text-cyan-400">(required for public)</span>
                  ) : (
                    <span className="text-gray-500">(optional)</span>
                  )}
                </label>
                <div className="relative">
                  <select
                    id="deck-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as DeckCategory | "")}
                    className="w-full px-4 py-2.5 bg-background text-foreground border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all appearance-none cursor-pointer"
                    disabled={isLoading}
                  >
                    <option value="">Select a category...</option>
                    {DECK_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {categoryLabels[cat]}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* Visibility */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Visibility
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPublic(false)}
                    disabled={isLoading}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${
                      !isPublic
                        ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400"
                        : "bg-background border-white/10 text-gray-400 hover:border-white/20"
                    }`}
                  >
                    <Lock className="w-4 h-4" />
                    Private
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPublic(true)}
                    disabled={isLoading}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${
                      isPublic
                        ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400"
                        : "bg-background border-white/10 text-gray-400 hover:border-white/20"
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                    Public
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {isPublic
                    ? "This deck will appear in Explore for others to discover and clone"
                    : "Only you and people you share with can access this deck"}
                </p>
              </div>

              {/* Error */}
              {error && <p className="text-sm text-red-400">{error}</p>}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm text-gray-300 hover:text-foreground transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !name.trim()}
                  className="px-4 py-2 text-sm text-white font-medium bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Creating..." : "Create Deck"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
