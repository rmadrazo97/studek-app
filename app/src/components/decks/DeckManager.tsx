"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Folder,
  MoreVertical,
  Edit2,
  Trash2,
  Share2,
  BookOpen,
  Clock,
  Sparkles,
  Globe,
  Lock,
  Upload,
  Play,
  Settings,
  LayoutGrid,
  List,
  ChevronRight,
} from "lucide-react";
import { useDecks, type DeckWithStats } from "@/hooks/useDecks";
import CreateDeckModal from "./CreateDeckModal";
import ShareDeckModal from "./ShareDeckModal";
import EditDeckModal from "./EditDeckModal";
import ImportAPKGModal from "./ImportAPKGModal";
import AIGenerateModal from "./AIGenerateModal";

// ============================================
// DeckCard Component
// ============================================

interface DeckCardProps {
  deck: DeckWithStats;
  onEdit: (deck: DeckWithStats) => void;
  onDelete: (deck: DeckWithStats) => void;
  onShare: (deck: DeckWithStats) => void;
  onManageCards: (deck: DeckWithStats) => void;
  onStudy: (deck: DeckWithStats) => void;
  isShared?: boolean;
}

function DeckCard({ deck, onEdit, onDelete, onShare, onManageCards, onStudy, isShared }: DeckCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const hasCards = deck.card_count > 0;
  const hasDueCards = deck.due_count > 0 || deck.new_count > 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative bg-background-secondary/50 rounded-xl border border-white/5 hover:border-white/10 transition-all overflow-hidden"
    >
      {/* Card Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-lg">
              <Folder className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-medium text-foreground line-clamp-1">
                {deck.name}
              </h3>
              {deck.description && (
                <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                  {deck.description}
                </p>
              )}
            </div>
          </div>

          {/* Public/Private indicator */}
          <div className="flex items-center gap-1">
            {deck.is_public ? (
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-gray-500" />
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs mb-4">
          <div className="flex items-center gap-1.5 text-gray-400">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{deck.card_count} cards</span>
          </div>
          {deck.due_count > 0 && (
            <div className="flex items-center gap-1.5 text-amber-400">
              <Clock className="w-3.5 h-3.5" />
              <span>{deck.due_count} due</span>
            </div>
          )}
          {deck.new_count > 0 && (
            <div className="flex items-center gap-1.5 text-cyan-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{deck.new_count} new</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Study Button - Primary action */}
          <button
            onClick={() => onStudy(deck)}
            disabled={!hasCards}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
              hasCards
                ? hasDueCards
                  ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:opacity-90"
                  : "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20"
                : "bg-gray-500/10 text-gray-500 cursor-not-allowed"
            }`}
          >
            <Play className="w-4 h-4" />
            {hasDueCards ? "Study Now" : hasCards ? "Review" : "No Cards"}
          </button>

          {/* Manage Cards Button */}
          <button
            onClick={() => onManageCards(deck)}
            className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-300 bg-white/5 hover:bg-white/10 rounded-lg transition-all"
          >
            <Settings className="w-4 h-4" />
            Cards
          </button>
        </div>

        {/* Shared indicator */}
        {isShared && deck.shared_permission && (
          <div className="mt-3 pt-3 border-t border-white/5">
            <span className="text-xs text-gray-500">
              Shared with you ({deck.shared_permission})
            </span>
          </div>
        )}
      </div>

      {/* Menu Button */}
      {!isShared && (
        <div className="absolute top-3 right-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/5 transition-all"
          >
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 top-8 z-20 w-40 bg-background-secondary border border-white/10 rounded-lg shadow-xl overflow-hidden"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onEdit(deck);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Deck
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onShare(deck);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onDelete(deck);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

// ============================================
// DeckListItem Component (List View)
// ============================================

interface DeckListItemProps {
  deck: DeckWithStats;
  onEdit: (deck: DeckWithStats) => void;
  onDelete: (deck: DeckWithStats) => void;
  onShare: (deck: DeckWithStats) => void;
  onManageCards: (deck: DeckWithStats) => void;
  onStudy: (deck: DeckWithStats) => void;
  isShared?: boolean;
}

function DeckListItem({ deck, onEdit, onDelete, onShare, onManageCards, onStudy, isShared }: DeckListItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const hasCards = deck.card_count > 0;
  const hasDueCards = deck.due_count > 0 || deck.new_count > 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="group flex items-center gap-3 p-3 bg-background-secondary/30 rounded-lg border border-white/5 hover:border-white/10 transition-all"
    >
      {/* Icon */}
      <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-lg shrink-0">
        <Folder className="w-4 h-4 text-cyan-400" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-foreground text-sm truncate">{deck.name}</h3>
          {deck.is_public ? (
            <Globe className="w-3 h-3 text-cyan-400 shrink-0" />
          ) : (
            <Lock className="w-3 h-3 text-gray-500 shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
          <span>{deck.card_count} cards</span>
          {deck.due_count > 0 && <span className="text-amber-400">{deck.due_count} due</span>}
          {deck.new_count > 0 && <span className="text-cyan-400">{deck.new_count} new</span>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onStudy(deck)}
          disabled={!hasCards}
          className={`p-2 rounded-lg transition-all ${
            hasCards
              ? hasDueCards
                ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                : "text-gray-400 hover:bg-white/5"
              : "text-gray-600 cursor-not-allowed"
          }`}
          title="Study"
        >
          <Play className="w-4 h-4" />
        </button>
        <button
          onClick={() => onManageCards(deck)}
          className="p-2 rounded-lg text-gray-400 hover:bg-white/5 transition-all"
          title="Manage Cards"
        >
          <Settings className="w-4 h-4" />
        </button>
        {!isShared && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg text-gray-400 hover:bg-white/5 transition-all"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 top-10 z-20 w-36 bg-background-secondary border border-white/10 rounded-lg shadow-xl overflow-hidden"
                  >
                    <button
                      onClick={() => { setShowMenu(false); onEdit(deck); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => { setShowMenu(false); onShare(deck); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      Share
                    </button>
                    <button
                      onClick={() => { setShowMenu(false); onDelete(deck); }}
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
        )}
      </div>
    </motion.div>
  );
}

// ============================================
// Main DeckManager Component
// ============================================

type ViewMode = "grid" | "list";

interface DeckManagerProps {
  onSelectDeck: (deck: DeckWithStats) => void;
}

export default function DeckManager({ onSelectDeck }: DeckManagerProps) {
  const router = useRouter();
  const { decks, sharedDecks, isLoading, error, createDeck, updateDeck, deleteDeck, refresh } = useDecks();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState<DeckWithStats | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const handleCreate = useCallback(
    async (data: { name: string; description?: string; is_public?: boolean }) => {
      await createDeck(data);
      setShowCreateModal(false);
    },
    [createDeck]
  );

  const handleUpdate = useCallback(
    async (data: { name?: string; description?: string; is_public?: boolean }) => {
      if (!selectedDeck) return;
      await updateDeck(selectedDeck.id, data);
      setShowEditModal(false);
      setSelectedDeck(null);
    },
    [selectedDeck, updateDeck]
  );

  const handleDelete = useCallback(async () => {
    if (!selectedDeck) return;
    await deleteDeck(selectedDeck.id);
    setShowDeleteConfirm(false);
    setSelectedDeck(null);
  }, [selectedDeck, deleteDeck]);

  const openEdit = useCallback((deck: DeckWithStats) => {
    setSelectedDeck(deck);
    setShowEditModal(true);
  }, []);

  const openShare = useCallback((deck: DeckWithStats) => {
    setSelectedDeck(deck);
    setShowShareModal(true);
  }, []);

  const openDelete = useCallback((deck: DeckWithStats) => {
    setSelectedDeck(deck);
    setShowDeleteConfirm(true);
  }, []);

  const handleStudy = useCallback((deck: DeckWithStats) => {
    router.push(`/study?deckId=${deck.id}`);
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        {/* Header - Mobile Responsive */}
        <div className="space-y-3">
          {/* Title Row */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">My Decks</h2>
              <p className="text-sm text-gray-500">
                {decks.length} {decks.length === 1 ? "deck" : "decks"}
              </p>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-background-secondary/50 rounded-lg p-1 border border-white/5">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded transition-all ${
                  viewMode === "grid"
                    ? "bg-cyan-500/10 text-cyan-400"
                    : "text-gray-500 hover:text-gray-300"
                }`}
                title="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded transition-all ${
                  viewMode === "list"
                    ? "bg-cyan-500/10 text-cyan-400"
                    : "text-gray-500 hover:text-gray-300"
                }`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Buttons - Stacked on mobile */}
          <div className="flex flex-wrap gap-2">
            <motion.button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 font-medium border border-white/10 rounded-lg hover:bg-white/5 hover:border-white/20 transition-all"
              whileTap={{ scale: 0.98 }}
            >
              <Upload className="w-4 h-4" />
              <span className="hidden xs:inline">Import</span>
            </motion.button>
            <motion.button
              onClick={() => setShowAIModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-white font-medium bg-gradient-to-r from-violet-500 to-purple-600 rounded-lg hover:opacity-90 transition-colors"
              whileTap={{ scale: 0.98 }}
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden xs:inline">AI Generate</span>
            </motion.button>
            <motion.button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-white font-medium bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg hover:opacity-90 transition-colors"
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden xs:inline">New Deck</span>
            </motion.button>
          </div>
        </div>

        {/* Decks Grid/List */}
        {decks.length === 0 ? (
          <div className="text-center py-12 bg-background-secondary/30 rounded-xl border border-white/5">
            <Folder className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-foreground mb-1">No decks yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              Create your first deck to start studying
            </p>
            <motion.button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white font-medium bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg hover:opacity-90 transition-colors"
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-4 h-4" />
              Create Deck
            </motion.button>
          </div>
        ) : viewMode === "grid" ? (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {decks.map((deck) => (
                <DeckCard
                  key={deck.id}
                  deck={deck}
                  onEdit={openEdit}
                  onDelete={openDelete}
                  onShare={openShare}
                  onManageCards={onSelectDeck}
                  onStudy={handleStudy}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div layout className="space-y-2">
            <AnimatePresence mode="popLayout">
              {decks.map((deck) => (
                <DeckListItem
                  key={deck.id}
                  deck={deck}
                  onEdit={openEdit}
                  onDelete={openDelete}
                  onShare={openShare}
                  onManageCards={onSelectDeck}
                  onStudy={handleStudy}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Shared Decks */}
        {sharedDecks.length > 0 && (
          <div className="mt-6 sm:mt-8">
            <h2 className="text-lg font-semibold text-foreground mb-3 sm:mb-4">
              Shared with Me
            </h2>
            {viewMode === "grid" ? (
              <motion.div
                layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                <AnimatePresence mode="popLayout">
                  {sharedDecks.map((deck) => (
                    <DeckCard
                      key={deck.id}
                      deck={deck}
                      onEdit={() => {}}
                      onDelete={() => {}}
                      onShare={() => {}}
                      onManageCards={onSelectDeck}
                      onStudy={handleStudy}
                      isShared
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div layout className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {sharedDecks.map((deck) => (
                    <DeckListItem
                      key={deck.id}
                      deck={deck}
                      onEdit={() => {}}
                      onDelete={() => {}}
                      onShare={() => {}}
                      onManageCards={onSelectDeck}
                      onStudy={handleStudy}
                      isShared
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateDeckModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreate}
      />

      <ImportAPKGModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportComplete={refresh}
      />

      <AIGenerateModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onSuccess={refresh}
      />

      {selectedDeck && (
        <>
          <EditDeckModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedDeck(null);
            }}
            deck={selectedDeck}
            onUpdate={handleUpdate}
          />

          <ShareDeckModal
            isOpen={showShareModal}
            onClose={() => {
              setShowShareModal(false);
              setSelectedDeck(null);
            }}
            deckId={selectedDeck.id}
            deckName={selectedDeck.name}
          />
        </>
      )}

      {/* Delete Confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && selectedDeck && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-background-secondary rounded-xl border border-white/10 p-6"
            >
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Delete Deck
              </h3>
              <p className="text-sm text-gray-400 mb-6">
                Are you sure you want to delete &quot;{selectedDeck.name}&quot;? This will
                also delete all {selectedDeck.card_count} cards in this deck. This action
                cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-sm text-gray-300 hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
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
