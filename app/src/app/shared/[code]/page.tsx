"use client";

import { use, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Folder,
  BookOpen,
  Check,
  Download,
  ChevronRight,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import { useSharedDeck } from "@/hooks/useDecks";
import { useAuth } from "@/stores/auth";

interface SharedDeckPageProps {
  params: Promise<{ code: string }>;
}

export default function SharedDeckPage({ params }: SharedDeckPageProps) {
  const { code } = use(params);
  const { deck, cards, permission, isLoading, error, canClone, cloneDeck } = useSharedDeck(code);
  const { isAuthenticated } = useAuth();

  const [isCloning, setIsCloning] = useState(false);
  const [cloneSuccess, setCloneSuccess] = useState(false);
  const [cloneError, setCloneError] = useState<string | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);

  const handleClone = useCallback(async () => {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      window.location.href = `/login?redirect=/shared/${code}`;
      return;
    }

    setIsCloning(true);
    setCloneError(null);

    try {
      await cloneDeck();
      setCloneSuccess(true);
    } catch (err) {
      setCloneError(err instanceof Error ? err.message : "Failed to clone deck");
    } finally {
      setIsCloning(false);
    }
  }, [code, isAuthenticated, cloneDeck]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center">
            <Folder className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">
            Deck Not Found
          </h1>
          <p className="text-gray-500 mb-6">
            {error || "This share link is invalid or has expired."}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  if (cloneSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-500/10 rounded-full flex items-center justify-center">
            <Check className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">
            Deck Cloned Successfully!
          </h1>
          <p className="text-gray-500 mb-6">
            &quot;{deck.name}&quot; has been added to your library.
          </p>
          <Link
            href="/library"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm text-white font-medium bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg hover:opacity-90 transition-colors"
          >
            Go to Library
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-white/5 bg-background-secondary/30">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Studek
          </Link>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-xl">
              <Folder className="w-8 h-8 text-cyan-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">{deck.name}</h1>
              {deck.description && (
                <p className="text-gray-400 mt-1">{deck.description}</p>
              )}
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  {deck.card_count} cards
                </span>
                <span className="px-2 py-0.5 bg-gray-500/10 rounded text-xs">
                  {permission === "clone" ? "Can clone" : "View only"}
                </span>
              </div>
            </div>

            {canClone && (
              <motion.button
                onClick={handleClone}
                disabled={isCloning}
                className="flex items-center gap-2 px-6 py-3 text-sm text-white font-medium bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg hover:opacity-90 transition-colors disabled:opacity-50"
                whileTap={{ scale: 0.98 }}
              >
                {isCloning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Cloning...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Clone to My Library
                  </>
                )}
              </motion.button>
            )}
          </div>

          {cloneError && (
            <p className="mt-4 text-sm text-red-400">{cloneError}</p>
          )}

          {!isAuthenticated && canClone && (
            <p className="mt-4 text-sm text-gray-500">
              <Link href={`/login?redirect=/shared/${code}`} className="text-cyan-400 hover:underline">
                Sign in
              </Link>{" "}
              to clone this deck to your library.
            </p>
          )}
        </div>
      </div>

      {/* Cards Preview */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">
            Preview Cards
          </h2>
          <button
            onClick={() => setShowAnswers(!showAnswers)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-foreground border border-white/10 rounded-lg hover:border-white/20 transition-all"
          >
            {showAnswers ? (
              <>
                <EyeOff className="w-4 h-4" />
                Hide Answers
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                Show Answers
              </>
            )}
          </button>
        </div>

        {cards.length === 0 ? (
          <div className="text-center py-12 bg-background-secondary/30 rounded-xl border border-white/5">
            <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">No cards in this deck yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cards.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-background-secondary/50 rounded-xl border border-white/5 overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-gray-500">#{index + 1}</span>
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
                  </div>

                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Question</p>
                    <p className="text-foreground">{card.front}</p>
                  </div>

                  <motion.div
                    initial={false}
                    animate={{ opacity: showAnswers ? 1 : 0.3, filter: showAnswers ? "blur(0px)" : "blur(4px)" }}
                    className="pt-3 border-t border-white/5"
                  >
                    <p className="text-xs text-gray-500 mb-1">Answer</p>
                    <p className="text-gray-300">{card.back}</p>
                  </motion.div>

                  {card.tags && card.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {card.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 text-[10px] bg-cyan-500/10 text-cyan-400 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
