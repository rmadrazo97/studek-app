"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Filter, Table2, Grid, ChevronDown } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { motion } from "framer-motion";

interface Card {
  id: string;
  front: string;
  back: string;
  deckId: string;
  deckName: string;
  state: string;
  due: string | null;
  stability: number | null;
  difficulty: number | null;
}

interface Deck {
  id: string;
  name: string;
}

export default function BrowserPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDeck, setSelectedDeck] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const fetchCards = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all decks first
      const decksResponse = await apiClient.get<{ decks: Deck[] }>("/api/decks");
      setDecks(decksResponse.decks || []);

      // Then fetch cards from each deck
      const allCards: Card[] = [];
      for (const deck of decksResponse.decks || []) {
        try {
          const deckResponse = await apiClient.get<{ deck: { cards: { id: string; front: string; back: string }[] } }>(
            `/api/decks/${deck.id}`
          );
          const deckCards = (deckResponse.deck?.cards || []).map((card) => ({
            ...card,
            deckId: deck.id,
            deckName: deck.name,
            state: "new",
            due: null,
            stability: null,
            difficulty: null,
          }));
          allCards.push(...deckCards);
        } catch {
          // Skip decks that fail to load
        }
      }
      setCards(allCards);
    } catch (error) {
      console.error("Failed to fetch cards:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const filteredCards = cards.filter((card) => {
    const matchesSearch =
      searchQuery === "" ||
      card.front.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.back.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDeck = selectedDeck === "all" || card.deckId === selectedDeck;
    return matchesSearch && matchesDeck;
  });

  const stripHtml = (html: string) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Card Browser</h1>
        <p className="text-zinc-400 mt-1">
          Browse and search all your flashcards
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search cards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-800 bg-zinc-900/50 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/50"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <select
            value={selectedDeck}
            onChange={(e) => setSelectedDeck(e.target.value)}
            className="pl-10 pr-8 py-2.5 rounded-lg border border-zinc-800 bg-zinc-900/50 text-zinc-100 focus:outline-none focus:border-violet-500/50 appearance-none cursor-pointer"
          >
            <option value="all">All Decks</option>
            {decks.map((deck) => (
              <option key={deck.id} value={deck.id}>
                {deck.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
        </div>

        <div className="flex rounded-lg border border-zinc-800 overflow-hidden">
          <button
            onClick={() => setViewMode("table")}
            className={`p-2.5 ${
              viewMode === "table"
                ? "bg-zinc-800 text-zinc-100"
                : "bg-zinc-900/50 text-zinc-500 hover:text-zinc-300"
            } transition-colors`}
          >
            <Table2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2.5 ${
              viewMode === "grid"
                ? "bg-zinc-800 text-zinc-100"
                : "bg-zinc-900/50 text-zinc-500 hover:text-zinc-300"
            } transition-colors`}
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-zinc-500">
        {loading
          ? "Loading..."
          : `${filteredCards.length} card${filteredCards.length !== 1 ? "s" : ""} found`}
      </p>

      {/* Cards display */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : viewMode === "table" ? (
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">
                    Front
                  </th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">
                    Back
                  </th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">
                    Deck
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCards.slice(0, 100).map((card) => (
                  <tr
                    key={card.id}
                    className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-zinc-200 max-w-xs truncate">
                      {stripHtml(card.front)}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-400 max-w-xs truncate">
                      {stripHtml(card.back)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-300">
                        {card.deckName}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredCards.length > 100 && (
            <div className="px-4 py-3 text-sm text-zinc-500 border-t border-zinc-800 bg-zinc-900/50">
              Showing first 100 of {filteredCards.length} cards
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCards.slice(0, 50).map((card) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition-colors"
            >
              <p className="text-zinc-200 text-sm line-clamp-2 mb-2">
                {stripHtml(card.front)}
              </p>
              <p className="text-zinc-500 text-xs line-clamp-2 mb-3">
                {stripHtml(card.back)}
              </p>
              <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-400">
                {card.deckName}
              </span>
            </motion.div>
          ))}
        </div>
      )}

      {filteredCards.length === 0 && !loading && (
        <div className="text-center py-12">
          <Table2 className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-400">No cards found</p>
          <p className="text-sm text-zinc-500 mt-1">
            Try adjusting your search or filters
          </p>
        </div>
      )}
    </div>
  );
}
