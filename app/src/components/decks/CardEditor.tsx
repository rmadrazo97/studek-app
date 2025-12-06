"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  X,
  ArrowLeft,
  Save,
  Trash2,
  Tag,
  FileText,
  BookOpen,
  MoreVertical,
  Edit2,
  Search,
} from "lucide-react";
import { useCards, type Card, type DeckWithStats } from "@/hooks/useDecks";

// ============================================
// CardItem Component
// ============================================

interface CardItemProps {
  card: Card;
  onEdit: (card: Card) => void;
  onDelete: (card: Card) => void;
}

function CardItem({ card, onEdit, onDelete }: CardItemProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative bg-background-secondary/50 rounded-lg border border-white/5 hover:border-white/10 transition-all overflow-hidden"
    >
      <div className="p-4">
        {/* Card Type Badge */}
        <div className="flex items-center justify-between mb-2">
          <span
            className={`px-2 py-0.5 text-xs rounded ${
              card.type === "basic"
                ? "bg-blue-500/10 text-blue-400"
                : card.type === "cloze"
                ? "bg-purple-500/10 text-purple-400"
                : "bg-orange-500/10 text-orange-400"
            }`}
          >
            {card.type}
          </span>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-white/5 transition-all"
            >
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>
            <AnimatePresence>
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 top-6 z-20 w-32 bg-background-secondary border border-white/10 rounded-lg shadow-xl overflow-hidden"
                  >
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onEdit(card);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onDelete(card);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Front */}
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1">Front</p>
          <p className="text-sm text-foreground line-clamp-2">{card.front}</p>
        </div>

        {/* Back */}
        <div>
          <p className="text-xs text-gray-500 mb-1">Back</p>
          <p className="text-sm text-gray-300 line-clamp-2">{card.back}</p>
        </div>

        {/* Tags */}
        {card.tags && card.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-white/5">
            {card.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 text-[10px] bg-cyan-500/10 text-cyan-400 rounded"
              >
                {tag}
              </span>
            ))}
            {card.tags.length > 3 && (
              <span className="px-1.5 py-0.5 text-[10px] bg-gray-500/10 text-gray-400 rounded">
                +{card.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================
// CreateCardForm Component
// ============================================

interface CreateCardFormProps {
  onSubmit: (data: { front: string; back: string; type: string; tags: string[] }) => Promise<void>;
  onCancel: () => void;
}

function CreateCardForm({ onSubmit, onCancel }: CreateCardFormProps) {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [type, setType] = useState<"basic" | "cloze" | "image-occlusion">("basic");
  const [tagsInput, setTagsInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!front.trim()) {
      setError("Front is required");
      return;
    }
    if (!back.trim()) {
      setError("Back is required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      await onSubmit({
        front: front.trim(),
        back: back.trim(),
        type,
        tags,
      });

      // Reset form for another card
      setFront("");
      setBack("");
      setTagsInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create card");
    } finally {
      setIsSubmitting(false);
    }
  }, [front, back, type, tagsInput, onSubmit]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-background-secondary/50 rounded-xl border border-white/10 p-6"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Card Type
          </label>
          <div className="flex gap-2">
            {(["basic", "cloze", "image-occlusion"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
                  type === t
                    ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400"
                    : "bg-background border-white/10 text-gray-400 hover:border-white/20"
                }`}
              >
                {t === "image-occlusion" ? "Image" : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Front */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Front
          </label>
          <textarea
            value={front}
            onChange={(e) => setFront(e.target.value)}
            placeholder="Question or prompt..."
            rows={3}
            className="w-full px-4 py-2.5 bg-background text-foreground placeholder-gray-500 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
          />
        </div>

        {/* Back */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Back
          </label>
          <textarea
            value={back}
            onChange={(e) => setBack(e.target.value)}
            placeholder="Answer or response..."
            rows={3}
            className="w-full px-4 py-2.5 bg-background text-foreground placeholder-gray-500 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Tags <span className="text-gray-500">(comma separated)</span>
          </label>
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="anatomy, high-yield, exam"
              className="w-full pl-10 pr-4 py-2.5 bg-background text-foreground placeholder-gray-500 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-300 hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !front.trim() || !back.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white font-medium bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? "Saving..." : "Save Card"}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

// ============================================
// Main CardEditor Component
// ============================================

interface CardEditorProps {
  deck: DeckWithStats;
  onBack: () => void;
}

export default function CardEditor({ deck, onBack }: CardEditorProps) {
  const {
    cards,
    isLoading,
    error,
    total,
    createCard,
    updateCard,
    deleteCard,
  } = useCards(deck.id);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [cardToDelete, setCardToDelete] = useState<Card | null>(null);

  const filteredCards = useMemo(() => {
    if (!searchQuery) return cards;
    const query = searchQuery.toLowerCase();
    return cards.filter(
      (c) =>
        c.front.toLowerCase().includes(query) ||
        c.back.toLowerCase().includes(query)
    );
  }, [cards, searchQuery]);

  const handleCreateCard = useCallback(
    async (data: { front: string; back: string; type: string; tags: string[] }) => {
      await createCard({
        front: data.front,
        back: data.back,
        type: data.type as "basic" | "cloze" | "image-occlusion",
        tags: data.tags,
      });
    },
    [createCard]
  );

  const handleDeleteCard = useCallback(async () => {
    if (!cardToDelete) return;
    await deleteCard(cardToDelete.id);
    setCardToDelete(null);
  }, [cardToDelete, deleteCard]);

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground">{deck.name}</h2>
            <p className="text-sm text-gray-500">
              {total} {total === 1 ? "card" : "cards"}
            </p>
          </div>
          <motion.button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white font-medium bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg hover:opacity-90 transition-colors"
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4" />
            Add Card
          </motion.button>
        </div>

        {/* Create Form */}
        <AnimatePresence>
          {showCreateForm && (
            <CreateCardForm
              onSubmit={handleCreateCard}
              onCancel={() => setShowCreateForm(false)}
            />
          )}
        </AnimatePresence>

        {/* Search */}
        {cards.length > 0 && (
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cards..."
              className="w-full pl-11 pr-4 py-2.5 bg-background-secondary/50 text-foreground placeholder-gray-500 border border-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
            />
          </div>
        )}

        {/* Cards Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400">{error}</p>
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="text-center py-12 bg-background-secondary/30 rounded-xl border border-white/5">
            {cards.length === 0 ? (
              <>
                <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-foreground mb-1">
                  No cards yet
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Add your first card to start studying
                </p>
                <motion.button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white font-medium bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg hover:opacity-90 transition-colors"
                  whileTap={{ scale: 0.98 }}
                >
                  <Plus className="w-4 h-4" />
                  Add Card
                </motion.button>
              </>
            ) : (
              <>
                <Search className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-foreground mb-1">
                  No matching cards
                </h3>
                <p className="text-sm text-gray-500">
                  Try a different search term
                </p>
              </>
            )}
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {filteredCards.map((card) => (
                <CardItem
                  key={card.id}
                  card={card}
                  onEdit={setEditingCard}
                  onDelete={setCardToDelete}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {cardToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setCardToDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-background-secondary rounded-xl border border-white/10 p-6"
            >
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Delete Card
              </h3>
              <p className="text-sm text-gray-400 mb-6">
                Are you sure you want to delete this card? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setCardToDelete(null)}
                  className="px-4 py-2 text-sm text-gray-300 hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCard}
                  className="px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
