"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  BookOpen,
  Clock,
  Compass,
  Library,
  Sparkles,
  BarChart3,
  Flame,
  ChevronRight,
  FolderOpen,
} from "lucide-react";
import Link from "next/link";
import { getAccessToken } from "@/stores/auth";
import { CreateDeckModal } from "@/components/decks";

// ============================================
// Types
// ============================================

interface DeckWithStats {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  card_count: number;
  due_count: number;
  new_count: number;
  created_at: string;
  updated_at: string;
}

interface DashboardStats {
  totalDecks: number;
  totalCards: number;
  dueToday: number;
  studyStreak: number;
}

interface DashboardData {
  stats: DashboardStats;
  recentlyVisited: DeckWithStats[];
  recentlyCreated: DeckWithStats[];
  dueForReview: DeckWithStats[];
}

// ============================================
// Category Colors
// ============================================

const categoryColors: Record<string, string> = {
  languages: "from-cyan-500 to-blue-500",
  medicine: "from-red-500 to-pink-500",
  science: "from-green-500 to-emerald-500",
  mathematics: "from-purple-500 to-violet-500",
  history: "from-amber-500 to-orange-500",
  geography: "from-teal-500 to-cyan-500",
  programming: "from-blue-500 to-indigo-500",
  business: "from-slate-500 to-gray-500",
  law: "from-yellow-500 to-amber-500",
  arts: "from-pink-500 to-rose-500",
  music: "from-violet-500 to-purple-500",
  literature: "from-orange-500 to-red-500",
  philosophy: "from-indigo-500 to-blue-500",
  psychology: "from-rose-500 to-pink-500",
  "test-prep": "from-emerald-500 to-green-500",
  other: "from-gray-500 to-slate-500",
};

// ============================================
// Quick Action Component
// ============================================

interface QuickActionProps {
  icon: React.ElementType;
  label: string;
  description: string;
  href?: string;
  onClick?: () => void;
  gradient: string;
}

function QuickAction({ icon: Icon, label, description, href, onClick, gradient }: QuickActionProps) {
  const content = (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative overflow-hidden rounded-2xl p-5 cursor-pointer
        bg-gradient-to-br ${gradient}
        border border-white/10
        group
      `}
    >
      <div className="relative z-10">
        <Icon className="w-8 h-8 text-white mb-3" />
        <h3 className="text-lg font-semibold text-white mb-1">{label}</h3>
        <p className="text-sm text-white/70">{description}</p>
      </div>
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
    </motion.div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return <div onClick={onClick}>{content}</div>;
}

// ============================================
// Deck Card Component
// ============================================

interface DeckCardProps {
  deck: DeckWithStats;
  showStats?: boolean;
}

function DeckCard({ deck, showStats = true }: DeckCardProps) {
  const hasDue = deck.due_count > 0;
  const hasNew = deck.new_count > 0;
  const colorClass = deck.category ? categoryColors[deck.category] : "from-gray-500 to-slate-500";

  return (
    <Link href={`/study?deck=${deck.id}`}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="group relative bg-[#0f0f11] border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 hover:bg-[#111114] transition-all duration-200"
      >
        {/* Color accent */}
        <div className={`absolute top-0 left-3 right-3 h-0.5 rounded-b-full bg-gradient-to-r ${colorClass} opacity-60 group-hover:opacity-100 transition-opacity`} />

        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center flex-shrink-0`}>
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-zinc-100 truncate">{deck.name}</h4>
            <p className="text-xs text-zinc-500">{deck.card_count} cards</p>
          </div>
          {showStats && (hasDue || hasNew) && (
            <div className="flex items-center gap-2">
              {hasDue && (
                <span className="px-2 py-1 text-xs font-medium bg-cyan-500/10 text-cyan-400 rounded-md border border-cyan-500/20">
                  {deck.due_count} due
                </span>
              )}
              {hasNew && (
                <span className="px-2 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-400 rounded-md border border-emerald-500/20">
                  {deck.new_count} new
                </span>
              )}
            </div>
          )}
          <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
        </div>
      </motion.div>
    </Link>
  );
}

// ============================================
// Stats Card Component
// ============================================

interface StatsCardProps {
  icon: React.ElementType;
  label: string;
  value: number | string;
  subtext?: string;
  color: string;
}

function StatsCard({ icon: Icon, label, value, subtext, color }: StatsCardProps) {
  return (
    <div className="bg-[#0f0f11] border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-zinc-100">{value}</p>
          <p className="text-xs text-zinc-500">{label}</p>
          {subtext && <p className="text-xs text-zinc-600 mt-0.5">{subtext}</p>}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Main Dashboard Component
// ============================================

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const token = getAccessToken();
      const response = await fetch("/api/dashboard", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.ok) {
        const dashboardData = await response.json();
        setData(dashboardData);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleCreateDeck = useCallback(async (deckData: {
    name: string;
    description?: string;
    category?: string;
    is_public?: boolean;
  }) => {
    const token = getAccessToken();
    const response = await fetch("/api/decks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(deckData),
    });

    if (!response.ok) {
      throw new Error("Failed to create deck");
    }

    setShowCreateModal(false);
    fetchDashboard();
  }, [fetchDashboard]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const stats = data?.stats || { totalDecks: 0, totalCards: 0, dueToday: 0, studyStreak: 0 };
  const recentlyVisited = data?.recentlyVisited || [];
  const recentlyCreated = data?.recentlyCreated || [];
  const dueForReview = data?.dueForReview || [];

  const hasDecks = stats.totalDecks > 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold font-display text-zinc-100">Dashboard</h1>
          <p className="text-zinc-500 mt-1">
            {stats.dueToday > 0
              ? `You have ${stats.dueToday} cards due for review today`
              : "All caught up! No cards due for review."}
          </p>
        </div>
      </motion.div>

      {/* Stats Row */}
      {hasDecks && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <StatsCard
            icon={FolderOpen}
            label="Total Decks"
            value={stats.totalDecks}
            color="bg-gradient-to-br from-cyan-500 to-blue-600"
          />
          <StatsCard
            icon={BookOpen}
            label="Total Cards"
            value={stats.totalCards}
            color="bg-gradient-to-br from-purple-500 to-violet-600"
          />
          <StatsCard
            icon={Clock}
            label="Due Today"
            value={stats.dueToday}
            color="bg-gradient-to-br from-amber-500 to-orange-600"
          />
          <StatsCard
            icon={Flame}
            label="Study Streak"
            value={`${stats.studyStreak} days`}
            color="bg-gradient-to-br from-rose-500 to-pink-600"
          />
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-lg font-semibold text-zinc-100 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickAction
            icon={Plus}
            label="Create Deck"
            description="Start a new flashcard deck"
            onClick={() => setShowCreateModal(true)}
            gradient="from-cyan-600 to-blue-700"
          />
          <QuickAction
            icon={Sparkles}
            label="Creation Studio"
            description="AI-powered card generation"
            href="/create"
            gradient="from-violet-600 to-purple-700"
          />
          <QuickAction
            icon={Compass}
            label="Explore"
            description="Discover public decks"
            href="/explore"
            gradient="from-emerald-600 to-teal-700"
          />
          <QuickAction
            icon={Library}
            label="My Library"
            description="Manage your decks"
            href="/library"
            gradient="from-amber-600 to-orange-700"
          />
        </div>
      </motion.section>

      {/* Due for Review */}
      {dueForReview.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-semibold text-zinc-100">Due for Review</h2>
            </div>
            <Link href="/library" className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {dueForReview.slice(0, 6).map((deck) => (
              <DeckCard key={deck.id} deck={deck} />
            ))}
          </div>
        </motion.section>
      )}

      {/* Recently Visited */}
      {recentlyVisited.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-semibold text-zinc-100">Recently Visited</h2>
            </div>
            <Link href="/library" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentlyVisited.slice(0, 6).map((deck) => (
              <DeckCard key={deck.id} deck={deck} showStats={false} />
            ))}
          </div>
        </motion.section>
      )}

      {/* Recently Created */}
      {recentlyCreated.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-semibold text-zinc-100">Recently Created</h2>
            </div>
            <Link href="/library" className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentlyCreated.slice(0, 6).map((deck) => (
              <DeckCard key={deck.id} deck={deck} showStats={false} />
            ))}
          </div>
        </motion.section>
      )}

      {/* Empty State for New Users */}
      {!hasDecks && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center py-16 bg-[#0f0f11] rounded-2xl border border-zinc-800"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-cyan-400" />
          </div>
          <h3 className="text-xl font-semibold text-zinc-100 mb-2">Welcome to Studek!</h3>
          <p className="text-zinc-500 mb-6 max-w-md mx-auto">
            Create your first deck to start learning with spaced repetition. Or explore public decks from the community.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl hover:opacity-90 transition-all"
            >
              Create Your First Deck
            </button>
            <Link
              href="/explore"
              className="px-6 py-3 text-sm font-medium text-zinc-300 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition-all"
            >
              Explore Public Decks
            </Link>
          </div>
        </motion.div>
      )}

      {/* Create Deck Modal */}
      <CreateDeckModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateDeck}
      />
    </div>
  );
}
