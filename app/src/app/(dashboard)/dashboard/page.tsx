"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, MoreHorizontal, BookOpen, Clock } from "lucide-react";
import Link from "next/link";

// Sample deck data - in production this would come from API/database
const sampleDecks = [
  {
    id: "1",
    name: "Medicine",
    hierarchy: "Medicine",
    dueCount: 42,
    newCount: 15,
    totalCount: 320,
    color: "from-rose-500 to-orange-500",
  },
  {
    id: "2",
    name: "Anatomy",
    hierarchy: "Medicine::Anatomy",
    dueCount: 18,
    newCount: 5,
    totalCount: 145,
    color: "from-pink-500 to-rose-500",
  },
  {
    id: "3",
    name: "Heart",
    hierarchy: "Medicine::Anatomy::Heart",
    dueCount: 15,
    newCount: 3,
    totalCount: 120,
    color: "from-red-500 to-pink-500",
  },
  {
    id: "4",
    name: "Brain",
    hierarchy: "Medicine::Anatomy::Brain",
    dueCount: 8,
    newCount: 2,
    totalCount: 98,
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "5",
    name: "Pharmacology",
    hierarchy: "Medicine::Pharmacology",
    dueCount: 24,
    newCount: 10,
    totalCount: 175,
    color: "from-violet-500 to-purple-500",
  },
  {
    id: "6",
    name: "Japanese",
    hierarchy: "Languages::Japanese",
    dueCount: 56,
    newCount: 20,
    totalCount: 450,
    color: "from-cyan-500 to-blue-500",
  },
  {
    id: "7",
    name: "N3 Vocabulary",
    hierarchy: "Languages::Japanese::N3 Vocabulary",
    dueCount: 8,
    newCount: 12,
    totalCount: 280,
    color: "from-teal-500 to-cyan-500",
  },
  {
    id: "8",
    name: "Spanish",
    hierarchy: "Languages::Spanish",
    dueCount: 12,
    newCount: 8,
    totalCount: 190,
    color: "from-amber-500 to-orange-500",
  },
  {
    id: "9",
    name: "Computer Science",
    hierarchy: "Computer Science",
    dueCount: 19,
    newCount: 7,
    totalCount: 85,
    color: "from-blue-500 to-indigo-500",
  },
  {
    id: "10",
    name: "Algorithms",
    hierarchy: "Computer Science::Algorithms",
    dueCount: 11,
    newCount: 4,
    totalCount: 65,
    color: "from-indigo-500 to-violet-500",
  },
  {
    id: "11",
    name: "Data Structures",
    hierarchy: "Computer Science::Data Structures",
    dueCount: 8,
    newCount: 3,
    totalCount: 52,
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: "12",
    name: "History",
    hierarchy: "History",
    dueCount: 0,
    newCount: 25,
    totalCount: 25,
    color: "from-yellow-500 to-amber-500",
  },
];

interface DeckCardProps {
  deck: (typeof sampleDecks)[0];
  index: number;
}

function DeckCard({ deck, index }: DeckCardProps) {
  const hasDue = deck.dueCount > 0;
  const hasNew = deck.newCount > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group relative bg-[#0f0f11] border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 hover:bg-[#111114] transition-all duration-200 cursor-pointer"
    >
      {/* Color accent bar */}
      <div
        className={`absolute top-0 left-4 right-4 h-1 rounded-b-full bg-gradient-to-r ${deck.color} opacity-60 group-hover:opacity-100 transition-opacity`}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${deck.color} flex items-center justify-center shadow-lg`}
        >
          <BookOpen className="w-6 h-6 text-white" />
        </div>
        <button className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 opacity-0 group-hover:opacity-100 transition-all">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Deck info */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-zinc-100 mb-1 truncate">
          {deck.name}
        </h3>
        <p className="text-xs text-zinc-500 truncate">{deck.hierarchy}</p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3">
        {hasDue && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-sm font-medium text-cyan-400">
              {deck.dueCount}
            </span>
          </div>
        )}
        {hasNew && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-400">
              {deck.newCount}
            </span>
          </div>
        )}
        <span className="text-xs text-zinc-500 ml-auto">
          {deck.totalCount} cards
        </span>
      </div>

      {/* Study button on hover */}
      <div className="absolute inset-x-5 bottom-5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Link
          href={`/study?deck=${deck.id}`}
          className="block w-full py-2 text-center text-sm font-medium text-zinc-900 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg hover:from-cyan-300 hover:to-blue-400 transition-all"
        >
          Study Now
        </Link>
      </div>
    </motion.div>
  );
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDecks = useMemo(() => {
    if (!searchQuery.trim()) return sampleDecks;

    const query = searchQuery.toLowerCase();
    return sampleDecks.filter(
      (deck) =>
        deck.name.toLowerCase().includes(query) ||
        deck.hierarchy.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const totalDue = sampleDecks.reduce((sum, deck) => sum + deck.dueCount, 0);
  const totalNew = sampleDecks.reduce((sum, deck) => sum + deck.newCount, 0);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold font-display text-zinc-100">Home</h1>
        <p className="text-zinc-500 mt-1">
          {totalDue > 0 ? (
            <>
              You have{" "}
              <span className="text-cyan-400 font-medium">{totalDue} cards</span>{" "}
              due for review
              {totalNew > 0 && (
                <>
                  {" "}
                  and{" "}
                  <span className="text-emerald-400 font-medium">
                    {totalNew} new cards
                  </span>{" "}
                  to learn
                </>
              )}
            </>
          ) : (
            "All caught up! No cards due for review."
          )}
        </p>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-8"
      >
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search decks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[#0f0f11] border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </motion.div>

      {/* Deck Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredDecks.map((deck, index) => (
            <DeckCard key={deck.id} deck={deck} index={index} />
          ))}
        </AnimatePresence>

        {/* Create New Deck Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: filteredDecks.length * 0.05 }}
          className="group relative bg-[#0f0f11] border border-dashed border-zinc-700 rounded-2xl p-5 hover:border-cyan-500/50 hover:bg-[#111114] transition-all duration-200 cursor-pointer flex flex-col items-center justify-center min-h-[200px]"
        >
          <div className="w-12 h-12 rounded-xl bg-zinc-800 group-hover:bg-cyan-500/20 flex items-center justify-center transition-colors mb-4">
            <Plus className="w-6 h-6 text-zinc-500 group-hover:text-cyan-400 transition-colors" />
          </div>
          <span className="text-sm font-medium text-zinc-500 group-hover:text-zinc-300 transition-colors">
            Create New Deck
          </span>
        </motion.div>
      </div>

      {/* Empty state */}
      {filteredDecks.length === 0 && searchQuery && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-zinc-500" />
          </div>
          <h3 className="text-lg font-medium text-zinc-300 mb-2">
            No decks found
          </h3>
          <p className="text-sm text-zinc-500">
            No decks match &quot;{searchQuery}&quot;. Try a different search term.
          </p>
        </motion.div>
      )}
    </div>
  );
}
