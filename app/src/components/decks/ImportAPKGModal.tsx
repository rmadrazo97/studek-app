"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Upload,
  FileArchive,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { DECK_CATEGORIES, type DeckCategory } from "@/lib/db/types";

// Category display names
const categoryLabels: Record<DeckCategory, string> = {
  languages: "Languages",
  medicine: "Medicine",
  science: "Science",
  mathematics: "Mathematics",
  history: "History",
  geography: "Geography",
  programming: "Programming",
  business: "Business",
  law: "Law",
  arts: "Arts",
  music: "Music",
  literature: "Literature",
  philosophy: "Philosophy",
  psychology: "Psychology",
  "test-prep": "Test Prep",
  other: "Other",
};

interface ImportResult {
  success: boolean;
  message: string;
  decks?: Array<{
    id: string;
    name: string;
    cardCount: number;
  }>;
  stats?: {
    totalDecks: number;
    totalCards: number;
    totalMedia: number;
  };
  error?: string;
}

interface ImportAPKGModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export default function ImportAPKGModal({
  isOpen,
  onClose,
  onImportComplete,
}: ImportAPKGModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<DeckCategory | "">("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (selectedFile: File | null) => {
      if (selectedFile && selectedFile.name.toLowerCase().endsWith(".apkg")) {
        setFile(selectedFile);
        setResult(null);
      } else if (selectedFile) {
        setResult({
          success: false,
          message: "Please select a valid .apkg file",
        });
      }
    },
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      handleFileSelect(droppedFile);
    },
    [handleFileSelect]
  );

  const handleImport = useCallback(async () => {
    if (!file) return;

    setIsLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (category) {
        formData.append("category", category);
      }

      const response = await fetch("/api/import/apkg", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          decks: data.decks,
          stats: data.stats,
        });
        onImportComplete();
      } else {
        setResult({
          success: false,
          message: data.error || "Import failed",
        });
      }
    } catch {
      setResult({
        success: false,
        message: "Failed to import file. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [file, category, onImportComplete]);

  const handleClose = useCallback(() => {
    if (!isLoading) {
      setFile(null);
      setCategory("");
      setResult(null);
      onClose();
    }
  }, [isLoading, onClose]);

  const resetForm = useCallback(() => {
    setFile(null);
    setCategory("");
    setResult(null);
  }, []);

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
                <div className="p-2 bg-gradient-to-br from-orange-500/20 to-red-600/20 rounded-lg">
                  <FileArchive className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Import Anki Deck
                  </h2>
                  <p className="text-xs text-gray-500">
                    Import .apkg files from Anki
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Success Result */}
              {result?.success && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg"
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-green-400 font-medium">
                        Import Successful!
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {result.stats?.totalDecks} deck(s) with{" "}
                        {result.stats?.totalCards} cards imported
                      </p>
                      {result.stats?.totalMedia ? (
                        <p className="text-xs text-gray-500">
                          {result.stats.totalMedia} media files imported
                        </p>
                      ) : null}
                      <div className="mt-3 space-y-1">
                        {result.decks?.map((deck) => (
                          <div
                            key={deck.id}
                            className="text-xs text-gray-300 flex items-center gap-2"
                          >
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                            {deck.name} ({deck.cardCount} cards)
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={resetForm}
                    className="mt-3 w-full py-2 text-sm text-gray-300 hover:text-foreground border border-white/10 rounded-lg hover:bg-white/5 transition-all"
                  >
                    Import Another
                  </button>
                </motion.div>
              )}

              {/* Error Result */}
              {result && !result.success && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-red-400 font-medium">
                        Import Failed
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {result.message}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* File Upload */}
              {!result?.success && (
                <>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                      isDragging
                        ? "border-cyan-500 bg-cyan-500/5"
                        : file
                          ? "border-green-500/50 bg-green-500/5"
                          : "border-white/10 hover:border-white/20 hover:bg-white/5"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".apkg"
                      onChange={(e) =>
                        handleFileSelect(e.target.files?.[0] || null)
                      }
                      className="hidden"
                      disabled={isLoading}
                    />

                    {file ? (
                      <div className="flex flex-col items-center gap-2">
                        <FileArchive className="w-10 h-10 text-green-400" />
                        <p className="text-sm font-medium text-foreground">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFile(null);
                          }}
                          className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-10 h-10 text-gray-400" />
                        <p className="text-sm text-gray-300">
                          Drop your .apkg file here
                        </p>
                        <p className="text-xs text-gray-500">
                          or click to browse (max 100MB)
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Category */}
                  <div>
                    <label
                      htmlFor="import-category"
                      className="block text-sm font-medium text-gray-300 mb-1.5"
                    >
                      Category <span className="text-gray-500">(optional)</span>
                    </label>
                    <div className="relative">
                      <select
                        id="import-category"
                        value={category}
                        onChange={(e) =>
                          setCategory(e.target.value as DeckCategory | "")
                        }
                        className="w-full px-4 py-2.5 bg-background text-foreground border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all appearance-none cursor-pointer"
                        disabled={isLoading}
                      >
                        <option value="">Select a category...</option>
                        {DECK_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {categoryLabels[cat]}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                  </div>

                  {/* Info box */}
                  <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                    <p className="text-xs text-gray-400">
                      <span className="text-blue-400 font-medium">Tip:</span>{" "}
                      You can download shared decks from{" "}
                      <a
                        href="https://ankiweb.net/shared/decks"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:underline"
                      >
                        AnkiWeb
                      </a>{" "}
                      or community resources like Reddit&apos;s r/Anki.
                    </p>
                  </div>
                </>
              )}

              {/* Actions */}
              {!result?.success && (
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
                    onClick={handleImport}
                    disabled={isLoading || !file}
                    className="px-4 py-2 text-sm text-white font-medium bg-gradient-to-r from-orange-500 to-red-600 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Import
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
