"use client";

import { useState, useCallback } from "react";
import { DeckManager, CardEditor } from "@/components/decks";
import type { DeckWithStats } from "@/hooks/useDecks";

export default function LibraryContent() {
  const [selectedDeck, setSelectedDeck] = useState<DeckWithStats | null>(null);

  const handleSelectDeck = useCallback((deck: DeckWithStats) => {
    setSelectedDeck(deck);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedDeck(null);
  }, []);

  return (
    <div className="p-4 sm:p-6">
      {selectedDeck ? (
        <CardEditor deck={selectedDeck} onBack={handleBack} />
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Library</h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Manage your decks and flashcards
            </p>
          </div>

          {/* Deck Manager */}
          <DeckManager onSelectDeck={handleSelectDeck} />
        </div>
      )}
    </div>
  );
}
