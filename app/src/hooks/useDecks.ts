"use client";

import { useState, useCallback, useEffect } from "react";
import { getAccessToken } from "@/stores/auth";

// ============================================
// Types
// ============================================

export interface Deck {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  hierarchy: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeckWithStats extends Deck {
  card_count: number;
  due_count: number;
  new_count: number;
  permission?: string;
  shared_permission?: string;
}

export interface Card {
  id: string;
  deck_id: string;
  type: "basic" | "cloze" | "image-occlusion";
  front: string;
  back: string;
  media_type: string | null;
  media_url: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface CardWithFSRS extends Card {
  fsrs: {
    card_id: string;
    stability: number;
    difficulty: number;
    due: string;
    last_review: string | null;
    reps: number;
    lapses: number;
    state: "new" | "learning" | "review" | "relearning";
  };
}

export interface ShareLink {
  id: string;
  deck_id: string;
  code: string;
  permission: "read" | "clone";
  is_active: boolean;
  expires_at: string | null;
  access_count: number;
  max_uses: number | null;
  created_at: string;
  url?: string;
}

export interface UserShare {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
  permission: "read" | "write" | "admin";
  created_at: string;
}

// ============================================
// API Helpers
// ============================================

async function authFetch(url: string, options: RequestInit = {}) {
  const token = getAccessToken();
  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  headers.set("Content-Type", "application/json");

  const response = await fetch(url, { ...options, headers });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

// ============================================
// useDecks Hook
// ============================================

export function useDecks() {
  const [decks, setDecks] = useState<DeckWithStats[]>([]);
  const [sharedDecks, setSharedDecks] = useState<DeckWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDecks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await authFetch("/api/decks");
      setDecks(data.owned || []);
      setSharedDecks(data.shared || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch decks");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createDeck = useCallback(
    async (deckData: { name: string; description?: string; is_public?: boolean }) => {
      const newDeck = await authFetch("/api/decks", {
        method: "POST",
        body: JSON.stringify(deckData),
      });
      setDecks((prev) => [{ ...newDeck, card_count: 0, due_count: 0, new_count: 0 }, ...prev]);
      return newDeck as Deck;
    },
    []
  );

  const updateDeck = useCallback(
    async (deckId: string, updates: { name?: string; description?: string; is_public?: boolean }) => {
      const updatedDeck = await authFetch(`/api/decks/${deckId}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      setDecks((prev) =>
        prev.map((d) => (d.id === deckId ? { ...d, ...updatedDeck } : d))
      );
      return updatedDeck as Deck;
    },
    []
  );

  const deleteDeck = useCallback(async (deckId: string) => {
    await authFetch(`/api/decks/${deckId}`, { method: "DELETE" });
    setDecks((prev) => prev.filter((d) => d.id !== deckId));
  }, []);

  useEffect(() => {
    fetchDecks();
  }, [fetchDecks]);

  return {
    decks,
    sharedDecks,
    isLoading,
    error,
    fetchDecks,
    createDeck,
    updateDeck,
    deleteDeck,
  };
}

// ============================================
// useCards Hook
// ============================================

export function useCards(deckId: string | null) {
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchCards = useCallback(async (filter?: "due" | "new") => {
    if (!deckId) return;

    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filter) params.set("filter", filter);

      const data = await authFetch(`/api/decks/${deckId}/cards?${params}`);
      setCards(data.cards || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch cards");
    } finally {
      setIsLoading(false);
    }
  }, [deckId]);

  const createCard = useCallback(
    async (cardData: { front: string; back: string; type?: string; tags?: string[] }) => {
      if (!deckId) throw new Error("No deck selected");

      const newCard = await authFetch(`/api/decks/${deckId}/cards`, {
        method: "POST",
        body: JSON.stringify(cardData),
      });
      setCards((prev) => [newCard, ...prev]);
      setTotal((prev) => prev + 1);
      return newCard as Card;
    },
    [deckId]
  );

  const createCards = useCallback(
    async (cardsData: Array<{ front: string; back: string; type?: string; tags?: string[] }>) => {
      if (!deckId) throw new Error("No deck selected");

      const newCards = await authFetch(`/api/decks/${deckId}/cards`, {
        method: "POST",
        body: JSON.stringify(cardsData),
      });
      setCards((prev) => [...newCards, ...prev]);
      setTotal((prev) => prev + newCards.length);
      return newCards as Card[];
    },
    [deckId]
  );

  const updateCard = useCallback(
    async (cardId: string, updates: { front?: string; back?: string; type?: string; tags?: string[] }) => {
      const updatedCard = await authFetch(`/api/cards/${cardId}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      setCards((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, ...updatedCard } : c))
      );
      return updatedCard as Card;
    },
    []
  );

  const deleteCard = useCallback(async (cardId: string) => {
    await authFetch(`/api/cards/${cardId}`, { method: "DELETE" });
    setCards((prev) => prev.filter((c) => c.id !== cardId));
    setTotal((prev) => prev - 1);
  }, []);

  useEffect(() => {
    if (deckId) {
      fetchCards();
    }
  }, [deckId, fetchCards]);

  return {
    cards,
    isLoading,
    error,
    total,
    fetchCards,
    createCard,
    createCards,
    updateCard,
    deleteCard,
  };
}

// ============================================
// useDeckSharing Hook
// ============================================

export function useDeckSharing(deckId: string | null) {
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [userShares, setUserShares] = useState<UserShare[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchShareInfo = useCallback(async () => {
    if (!deckId) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await authFetch(`/api/decks/${deckId}/share`);
      setShareLinks(data.links || []);
      setUserShares(data.users || []);
      setIsPublic(data.is_public || false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch share info");
    } finally {
      setIsLoading(false);
    }
  }, [deckId]);

  const createShareLink = useCallback(
    async (options: { permission?: "read" | "clone"; expires_at?: string; max_uses?: number }) => {
      if (!deckId) throw new Error("No deck selected");

      const newLink = await authFetch(`/api/decks/${deckId}/share`, {
        method: "POST",
        body: JSON.stringify({ type: "link", ...options }),
      });
      setShareLinks((prev) => [newLink, ...prev]);
      return newLink as ShareLink;
    },
    [deckId]
  );

  const shareWithUser = useCallback(
    async (email: string, permission: "read" | "write" | "admin" = "read") => {
      if (!deckId) throw new Error("No deck selected");

      const newShare = await authFetch(`/api/decks/${deckId}/share`, {
        method: "POST",
        body: JSON.stringify({ type: "user", email, permission }),
      });
      setUserShares((prev) => [newShare, ...prev]);
      return newShare as UserShare;
    },
    [deckId]
  );

  const removeShareLink = useCallback(
    async (linkId: string) => {
      if (!deckId) throw new Error("No deck selected");

      await authFetch(`/api/decks/${deckId}/share?linkId=${linkId}`, {
        method: "DELETE",
      });
      setShareLinks((prev) => prev.map((l) => (l.id === linkId ? { ...l, is_active: false } : l)));
    },
    [deckId]
  );

  const removeUserShare = useCallback(
    async (shareId: string) => {
      if (!deckId) throw new Error("No deck selected");

      await authFetch(`/api/decks/${deckId}/share?shareId=${shareId}`, {
        method: "DELETE",
      });
      setUserShares((prev) => prev.filter((s) => s.id !== shareId));
    },
    [deckId]
  );

  useEffect(() => {
    if (deckId) {
      fetchShareInfo();
    }
  }, [deckId, fetchShareInfo]);

  return {
    shareLinks,
    userShares,
    isPublic,
    isLoading,
    error,
    fetchShareInfo,
    createShareLink,
    shareWithUser,
    removeShareLink,
    removeUserShare,
  };
}

// ============================================
// useSharedDeck Hook (for viewing shared decks)
// ============================================

export function useSharedDeck(code: string | null) {
  const [deck, setDeck] = useState<{
    id: string;
    name: string;
    description: string | null;
    card_count: number;
  } | null>(null);
  const [cards, setCards] = useState<Array<{
    id: string;
    type: string;
    front: string;
    back: string;
    tags: string[];
  }>>([]);
  const [permission, setPermission] = useState<"read" | "clone">("read");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSharedDeck = useCallback(async () => {
    if (!code) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await fetch(`/api/decks/shared/${code}`).then((r) => r.json());
      if (data.error) throw new Error(data.error);

      setDeck(data.deck);
      setCards(data.cards || []);
      setPermission(data.permission || "read");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch shared deck");
    } finally {
      setIsLoading(false);
    }
  }, [code]);

  const cloneDeck = useCallback(async () => {
    if (!code) throw new Error("No share code");

    const data = await authFetch(`/api/decks/shared/${code}`, { method: "POST" });
    return data.deck as Deck;
  }, [code]);

  useEffect(() => {
    if (code) {
      fetchSharedDeck();
    }
  }, [code, fetchSharedDeck]);

  return {
    deck,
    cards,
    permission,
    isLoading,
    error,
    canClone: permission === "clone",
    fetchSharedDeck,
    cloneDeck,
  };
}
