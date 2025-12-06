"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Edit2, Globe, Lock } from "lucide-react";
import type { DeckWithStats } from "@/hooks/useDecks";

interface EditDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  deck: DeckWithStats;
  onUpdate: (data: { name?: string; description?: string; is_public?: boolean }) => Promise<void>;
}

export default function EditDeckModal({
  isOpen,
  onClose,
  deck,
  onUpdate,
}: EditDeckModalProps) {
  const [name, setName] = useState(deck.name);
  const [description, setDescription] = useState(deck.description || "");
  const [isPublic, setIsPublic] = useState(deck.is_public);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update form when deck changes
  useEffect(() => {
    setName(deck.name);
    setDescription(deck.description || "");
    setIsPublic(deck.is_public);
  }, [deck]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Deck name is required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onUpdate({
        name: name.trim(),
        description: description.trim() || undefined,
        is_public: isPublic,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update deck");
    } finally {
      setIsLoading(false);
    }
  }, [name, description, isPublic, onUpdate]);

  const handleClose = useCallback(() => {
    if (!isLoading) {
      setError(null);
      onClose();
    }
  }, [isLoading, onClose]);

  const hasChanges =
    name !== deck.name ||
    description !== (deck.description || "") ||
    isPublic !== deck.is_public;

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
                  <Edit2 className="w-5 h-5 text-cyan-400" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">
                  Edit Deck
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
                  htmlFor="edit-deck-name"
                  className="block text-sm font-medium text-gray-300 mb-1.5"
                >
                  Name
                </label>
                <input
                  id="edit-deck-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Deck name"
                  className="w-full px-4 py-2.5 bg-background text-foreground placeholder-gray-500 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                  disabled={isLoading}
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="edit-deck-description"
                  className="block text-sm font-medium text-gray-300 mb-1.5"
                >
                  Description <span className="text-gray-500">(optional)</span>
                </label>
                <textarea
                  id="edit-deck-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-background text-foreground placeholder-gray-500 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all resize-none"
                  disabled={isLoading}
                />
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
              </div>

              {/* Error */}
              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}

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
                  disabled={isLoading || !name.trim() || !hasChanges}
                  className="px-4 py-2 text-sm text-white font-medium bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
