"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Globe,
  BookOpen,
  Download,
  Sparkles,
  Stethoscope,
  FlaskConical,
  Calculator,
  History,
  MapPin,
  Code,
  Briefcase,
  Scale,
  Palette,
  Music,
  BookMarked,
  Brain,
  Heart,
  ClipboardList,
  MoreHorizontal,
} from "lucide-react";
import Link from "next/link";
import { type DeckCategory } from "@/lib/db/types";

// ============================================
// Types
// ============================================

interface PublicDeck {
  id: string;
  name: string;
  description: string | null;
  category: DeckCategory | null;
  card_count: number;
  clone_count: number;
  author_name: string | null;
  author_email: string;
  created_at: string;
}

interface CategoryCount {
  category: DeckCategory;
  count: number;
}

// ============================================
// Category Icons & Labels
// ============================================

const categoryConfig: Record<DeckCategory, { icon: React.ElementType; label: string; color: string }> = {
  languages: { icon: Globe, label: "Languages", color: "from-cyan-500 to-blue-500" },
  medicine: { icon: Stethoscope, label: "Medicine", color: "from-red-500 to-pink-500" },
  science: { icon: FlaskConical, label: "Science", color: "from-green-500 to-emerald-500" },
  mathematics: { icon: Calculator, label: "Mathematics", color: "from-purple-500 to-violet-500" },
  history: { icon: History, label: "History", color: "from-amber-500 to-orange-500" },
  geography: { icon: MapPin, label: "Geography", color: "from-teal-500 to-cyan-500" },
  programming: { icon: Code, label: "Programming", color: "from-blue-500 to-indigo-500" },
  business: { icon: Briefcase, label: "Business", color: "from-slate-500 to-gray-500" },
  law: { icon: Scale, label: "Law", color: "from-yellow-500 to-amber-500" },
  arts: { icon: Palette, label: "Arts", color: "from-pink-500 to-rose-500" },
  music: { icon: Music, label: "Music", color: "from-violet-500 to-purple-500" },
  literature: { icon: BookMarked, label: "Literature", color: "from-orange-500 to-red-500" },
  philosophy: { icon: Brain, label: "Philosophy", color: "from-indigo-500 to-blue-500" },
  psychology: { icon: Heart, label: "Psychology", color: "from-rose-500 to-pink-500" },
  "test-prep": { icon: ClipboardList, label: "Test Prep", color: "from-emerald-500 to-green-500" },
  other: { icon: MoreHorizontal, label: "Other", color: "from-gray-500 to-slate-500" },
};

// ============================================
// DeckCard Component
// ============================================

interface DeckCardProps {
  deck: PublicDeck;
}

function DeckCard({ deck }: DeckCardProps) {
  const category = deck.category ? categoryConfig[deck.category] : null;
  const CategoryIcon = category?.icon || BookOpen;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative bg-[#0f0f11] border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 hover:bg-[#111114] transition-all duration-200"
    >
      {/* Color accent */}
      <div
        className={`absolute top-0 left-4 right-4 h-1 rounded-b-full bg-gradient-to-r ${
          category?.color || "from-gray-500 to-slate-500"
        } opacity-60 group-hover:opacity-100 transition-opacity`}
      />

      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
            category?.color || "from-gray-500 to-slate-500"
          } flex items-center justify-center shadow-lg`}
        >
          <CategoryIcon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-zinc-100 truncate">{deck.name}</h3>
          {deck.description && (
            <p className="text-sm text-zinc-500 line-clamp-2 mt-0.5">{deck.description}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-1.5 text-zinc-400">
          <BookOpen className="w-4 h-4" />
          <span>{deck.card_count} cards</span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-400">
          <Download className="w-4 h-4" />
          <span>{deck.clone_count} clones</span>
        </div>
      </div>

      {/* Author */}
      <div className="flex items-center gap-2 pt-4 border-t border-zinc-800">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-medium">
          {(deck.author_name || deck.author_email)[0].toUpperCase()}
        </div>
        <span className="text-sm text-zinc-500 truncate">
          {deck.author_name || deck.author_email.split("@")[0]}
        </span>
      </div>

      {/* View Button */}
      <Link
        href={`/library?preview=${deck.id}`}
        className="absolute inset-0 rounded-2xl"
      >
        <span className="sr-only">View {deck.name}</span>
      </Link>
    </motion.div>
  );
}

// ============================================
// CategoryCard Component
// ============================================

interface CategoryCardProps {
  category: DeckCategory;
  count: number;
  isSelected: boolean;
  onClick: () => void;
}

function CategoryCard({ category, count, isSelected, onClick }: CategoryCardProps) {
  const config = categoryConfig[category];
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl border transition-all
        ${
          isSelected
            ? `bg-gradient-to-r ${config.color} border-transparent text-white`
            : "bg-[#0f0f11] border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
        }
      `}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{config.label}</span>
      <span
        className={`ml-auto px-2 py-0.5 text-xs rounded-full ${
          isSelected ? "bg-white/20" : "bg-zinc-800"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

// ============================================
// Main ExplorePage Component
// ============================================

export default function ExplorePage() {
  const [decks, setDecks] = useState<PublicDeck[]>([]);
  const [categories, setCategories] = useState<CategoryCount[]>([]);
  const [featuredDecks, setFeaturedDecks] = useState<PublicDeck[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<DeckCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Fetch explore data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.set("category", selectedCategory);
      if (searchQuery) params.set("search", searchQuery);

      const response = await fetch(`/api/explore?${params}`);
      const data = await response.json();

      setDecks(data.decks || []);
      setCategories(data.categories || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Failed to fetch explore data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  // Fetch featured decks
  useEffect(() => {
    fetch("/api/explore?featured=true")
      .then((r) => r.json())
      .then((data) => setFeaturedDecks(data.featured || []))
      .catch(console.error);
  }, []);

  // Fetch data when filters change
  useEffect(() => {
    const debounce = setTimeout(fetchData, 300);
    return () => clearTimeout(debounce);
  }, [fetchData]);

  const handleCategoryClick = useCallback((category: DeckCategory) => {
    setSelectedCategory((prev) => (prev === category ? null : category));
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold font-display text-zinc-100">Explore</h1>
          <p className="text-zinc-500 mt-1">
            Discover and clone public decks from the community
          </p>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search public decks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[#0f0f11] border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
          />
        </div>
      </motion.div>

      {/* Featured Section */}
      {!selectedCategory && !searchQuery && featuredDecks.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-zinc-100">Featured Decks</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredDecks.map((deck) => (
              <DeckCard key={deck.id} deck={deck} />
            ))}
          </div>
        </motion.section>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-lg font-semibold text-zinc-100 mb-4">Categories</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map(({ category, count }) => (
              <CategoryCard
                key={category}
                category={category}
                count={count}
                isSelected={selectedCategory === category}
                onClick={() => handleCategoryClick(category)}
              />
            ))}
          </div>
        </motion.section>
      )}

      {/* Results */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-100">
            {selectedCategory
              ? categoryConfig[selectedCategory].label
              : searchQuery
              ? "Search Results"
              : "All Public Decks"}
          </h2>
          <span className="text-sm text-zinc-500">{total} decks</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full" />
          </div>
        ) : decks.length === 0 ? (
          <div className="text-center py-12 bg-[#0f0f11] rounded-2xl border border-zinc-800">
            <Globe className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-zinc-300 mb-1">No decks found</h3>
            <p className="text-sm text-zinc-500">
              {searchQuery
                ? `No results for "${searchQuery}"`
                : "No public decks in this category yet"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {decks.map((deck) => (
                <DeckCard key={deck.id} deck={deck} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </div>
  );
}
