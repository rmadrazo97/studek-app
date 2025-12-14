"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  X,
  Sparkles,
  Loader2,
  BookOpen,
  ChevronRight,
  Check,
  AlertCircle,
  Lightbulb,
  Globe,
  History,
  Code,
  Stethoscope,
  Music,
  LogIn,
  Mic,
  MicOff,
  Square,
  Youtube,
  FileText,
  Link,
  Type,
  Upload,
  FileCheck,
  Target,
} from "lucide-react";
import { useAI, type SourceType, type SourceInput } from "@/hooks/useAI";
import { useAuth } from "@/stores/auth";
import { useOpenAITranscription } from "@/hooks/useOpenAITranscription";

// ============================================
// Types
// ============================================

interface AIGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  deckId?: string;
  deckName?: string;
}

interface SuggestionCategory {
  icon: React.ElementType;
  name: string;
  examples: string[];
  color: string;
}

// ============================================
// Suggestions
// ============================================

const suggestions: SuggestionCategory[] = [
  {
    icon: Globe,
    name: "Geography",
    examples: [
      "Create a deck with the capitals of South America",
      "Add the capitals of Central America",
      "Countries and capitals of Europe",
    ],
    color: "text-emerald-400",
  },
  {
    icon: History,
    name: "History",
    examples: [
      "Create a deck to learn the presidents of the USA",
      "World War II major battles and dates",
      "Ancient Roman emperors",
    ],
    color: "text-amber-400",
  },
  {
    icon: Code,
    name: "Programming",
    examples: [
      "JavaScript array methods with examples",
      "Python data structures basics",
      "SQL query fundamentals",
    ],
    color: "text-blue-400",
  },
  {
    icon: Stethoscope,
    name: "Medicine",
    examples: [
      "Human anatomy: bones of the skeleton",
      "Common medical terminology",
      "Pharmacology drug classes",
    ],
    color: "text-red-400",
  },
  {
    icon: Music,
    name: "Languages",
    examples: [
      "Common Spanish verbs for beginners",
      "Japanese hiragana characters",
      "French travel phrases",
    ],
    color: "text-violet-400",
  },
];

// Source type tabs
const sourceTabs: { type: SourceType; icon: React.ElementType; label: string; description: string }[] = [
  { type: "text", icon: Type, label: "Text", description: "Describe what you want to learn" },
  { type: "youtube", icon: Youtube, label: "YouTube", description: "Learn from a video" },
  { type: "pdf", icon: FileText, label: "PDF", description: "Extract from document" },
  { type: "url", icon: Link, label: "Web Link", description: "Learn from a webpage" },
];

// ============================================
// Component
// ============================================

export function AIGenerateModal({
  isOpen,
  onClose,
  onSuccess,
  deckId,
  deckName,
}: AIGenerateModalProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Source type state
  const [sourceType, setSourceType] = useState<SourceType>("text");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [webUrl, setWebUrl] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [focusPrompt, setFocusPrompt] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    isGenerating,
    isExtracting,
    error,
    extractionError,
    result,
    extractedContent,
    generateDeck,
    addCards,
    reset,
    extractYouTube,
    extractPDF,
    extractURL,
    clearExtraction,
  } = useAI();

  // OpenAI Transcription hook (higher quality than browser speech recognition)
  const {
    isRecording,
    isTranscribing,
    isSupported: isSpeechSupported,
    isAvailable: isTranscriptionAvailable,
    transcript,
    error: speechError,
    startRecording,
    stopRecording,
    resetTranscript,
  } = useOpenAITranscription({
    language: 'en',
  });

  // Combined listening state (recording or transcribing)
  const isListening = isRecording || isTranscribing;

  const isAddingToExisting = !!deckId;

  // Track previous isOpen state to detect open transition
  const prevIsOpenRef = useRef(isOpen);

  // Update prompt when transcript changes
  useEffect(() => {
    if (transcript) {
      setPrompt(prev => {
        // If starting fresh, use transcript directly
        if (!prev.trim()) return transcript;
        // Otherwise append with space
        return prev + ' ' + transcript;
      });
    }
  }, [transcript]);

  // Reset state when modal opens (only on transition from closed to open)
  useEffect(() => {
    const wasOpen = prevIsOpenRef.current;
    prevIsOpenRef.current = isOpen;

    // Only reset when transitioning from closed to open
    if (isOpen && !wasOpen) {
      setPrompt("");
      setShowSuggestions(true);
      setSourceType("text");
      setYoutubeUrl("");
      setWebUrl("");
      setPdfFile(null);
      setFocusPrompt("");
      reset();
      resetTranscript();
    }
  }, [isOpen, reset, resetTranscript]);

  // Stop recording when modal closes
  useEffect(() => {
    if (!isOpen && isRecording) {
      stopRecording();
    }
  }, [isOpen, isRecording, stopRecording]);

  // Handle microphone toggle
  const handleMicToggle = useCallback(async () => {
    if (isRecording) {
      stopRecording();
    } else if (!isTranscribing) {
      resetTranscript();
      await startRecording();
      setShowSuggestions(false);
    }
  }, [isRecording, isTranscribing, startRecording, stopRecording, resetTranscript]);

  // Handle extraction from source
  const handleExtract = useCallback(async () => {
    if (sourceType === "youtube" && youtubeUrl) {
      await extractYouTube(youtubeUrl);
    } else if (sourceType === "pdf" && pdfFile) {
      await extractPDF(pdfFile);
    } else if (sourceType === "url" && webUrl) {
      await extractURL(webUrl);
    }
  }, [sourceType, youtubeUrl, pdfFile, webUrl, extractYouTube, extractPDF, extractURL]);

  // Handle PDF file selection
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPdfFile(file);
      clearExtraction();
    }
  }, [clearExtraction]);

  // Handle generation
  const handleGenerate = useCallback(async () => {
    // For text mode, require prompt
    if (sourceType === "text" && !prompt.trim()) return;

    // For source modes, require extracted content
    if (sourceType !== "text" && !extractedContent?.content) {
      // Try to extract first
      await handleExtract();
      return;
    }

    // Stop recording if active
    if (isRecording) {
      stopRecording();
    }

    setShowSuggestions(false);

    // Build source input if using a source
    let source: SourceInput | undefined;
    if (sourceType !== "text" && extractedContent?.content) {
      source = {
        type: sourceType,
        content: extractedContent.content,
        title: extractedContent.title || extractedContent.filename,
        url: sourceType === "youtube" ? youtubeUrl : sourceType === "url" ? webUrl : undefined,
      };
    }

    if (isAddingToExisting && deckId) {
      if (source) {
        await addCards(deckId, "", { source, focusPrompt: focusPrompt || undefined });
      } else {
        await addCards(deckId, prompt);
      }
    } else {
      if (source) {
        await generateDeck("", { isPublic, source, focusPrompt: focusPrompt || undefined });
      } else {
        await generateDeck(prompt, { isPublic });
      }
    }
  }, [
    sourceType, prompt, extractedContent, isRecording, stopRecording,
    isAddingToExisting, deckId, isPublic, addCards, generateDeck,
    handleExtract, youtubeUrl, webUrl, focusPrompt
  ]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: string) => {
    setPrompt(suggestion);
    setShowSuggestions(false);
  }, []);

  // Handle success
  useEffect(() => {
    if (result?.success) {
      onSuccess?.();
      // Auto-close after showing success
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [result, onSuccess, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-[#111114] border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-100">
                  {isAddingToExisting ? `Add Cards to "${deckName}"` : "Create Deck with AI"}
                </h2>
                <p className="text-sm text-zinc-500">
                  From text, YouTube, PDF, or web content
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4 overflow-y-auto flex-1">
            {/* Auth check - show login prompt if not authenticated */}
            {!authLoading && !isAuthenticated ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-violet-500/10 flex items-center justify-center">
                  <LogIn className="w-8 h-8 text-violet-400" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-100 mb-2">
                  Sign in to create decks
                </h3>
                <p className="text-sm text-zinc-500 mb-6">
                  You need to be logged in to create AI-generated decks
                </p>
                <button
                  onClick={() => {
                    onClose();
                    router.push("/login");
                  }}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-violet-500 to-purple-600 rounded-lg hover:opacity-90 transition-all"
                >
                  Sign In
                </button>
              </div>
            ) : (
            <>
            {/* Source Type Tabs */}
            <div className="flex gap-1 p-1 bg-zinc-900 rounded-xl">
              {sourceTabs.map((tab) => (
                <button
                  key={tab.type}
                  onClick={() => {
                    setSourceType(tab.type);
                    clearExtraction();
                  }}
                  disabled={isGenerating || isExtracting}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    sourceType === tab.type
                      ? "bg-violet-500 text-white"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                  } disabled:opacity-50`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Source-specific inputs */}
            {sourceType === "text" ? (
              /* Text Input with Voice */
              <div className="space-y-2">
                <div className="relative">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={
                      isRecording
                        ? "Recording... speak now"
                        : isTranscribing
                          ? "Transcribing..."
                          : isAddingToExisting
                            ? "Add the capitals of Central America..."
                            : "Create a deck with the capitals of South America..."
                    }
                    disabled={isGenerating || isListening}
                    className={`w-full h-24 px-4 py-3 pr-14 bg-zinc-900 border rounded-xl text-zinc-100 placeholder-zinc-500 resize-none focus:outline-none focus:ring-2 disabled:opacity-50 transition-all ${
                      isRecording
                        ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20"
                        : isTranscribing
                          ? "border-violet-500/50 focus:border-violet-500/50 focus:ring-violet-500/20"
                          : "border-zinc-700 focus:border-violet-500/50 focus:ring-violet-500/20"
                    }`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && !isListening) {
                        e.preventDefault();
                        handleGenerate();
                      }
                    }}
                  />

                  {/* Microphone button */}
                  {isSpeechSupported && isTranscriptionAvailable !== false && (
                    <button
                      onClick={handleMicToggle}
                      disabled={isGenerating || isTranscribing}
                      className={`absolute top-3 right-3 p-2 rounded-lg transition-all ${
                        isRecording
                          ? "bg-red-500 text-white animate-pulse"
                          : isTranscribing
                            ? "bg-violet-500 text-white"
                            : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                      } disabled:opacity-50`}
                      title={isRecording ? "Stop recording" : isTranscribing ? "Transcribing..." : "Start voice input"}
                    >
                      {isRecording ? (
                        <Square className="w-4 h-4" />
                      ) : isTranscribing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Mic className="w-4 h-4" />
                      )}
                    </button>
                  )}

                  <div className="absolute bottom-3 right-3 text-xs text-zinc-500">
                    {isRecording ? (
                      <span className="text-red-400 flex items-center gap-1">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        Recording...
                      </span>
                    ) : isTranscribing ? (
                      <span className="text-violet-400 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Transcribing...
                      </span>
                    ) : (
                      "Press Enter to generate"
                    )}
                  </div>
                </div>

                {/* Voice input hint */}
                {isSpeechSupported && isTranscriptionAvailable !== false && !isListening && !prompt && !isGenerating && !result && (
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <Mic className="w-3 h-3" />
                    <span>Tap the microphone to describe your deck with voice (powered by AI)</span>
                  </div>
                )}

                {/* Speech error */}
                {speechError && (
                  <div className="flex items-center gap-2 text-xs text-amber-400">
                    <MicOff className="w-3 h-3" />
                    <span>{speechError}</span>
                  </div>
                )}
              </div>
            ) : sourceType === "youtube" ? (
              /* YouTube URL Input */
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => {
                      setYoutubeUrl(e.target.value);
                      clearExtraction();
                    }}
                    placeholder="https://www.youtube.com/watch?v=..."
                    disabled={isGenerating || isExtracting}
                    className="w-full px-4 py-3 pl-11 bg-zinc-900 border border-zinc-700 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:border-violet-500/50 focus:ring-violet-500/20 disabled:opacity-50"
                  />
                  <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                </div>
                {!extractedContent && youtubeUrl && (
                  <button
                    onClick={handleExtract}
                    disabled={isExtracting || !youtubeUrl}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded-lg hover:bg-violet-500/20 disabled:opacity-50 transition-all"
                  >
                    {isExtracting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Extracting transcript...
                      </>
                    ) : (
                      <>
                        <FileCheck className="w-4 h-4" />
                        Extract Transcript
                      </>
                    )}
                  </button>
                )}
              </div>
            ) : sourceType === "pdf" ? (
              /* PDF File Upload */
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isGenerating || isExtracting}
                  className="w-full flex items-center justify-center gap-3 px-4 py-6 bg-zinc-900 border-2 border-dashed border-zinc-700 rounded-xl text-zinc-400 hover:text-zinc-200 hover:border-violet-500/50 hover:bg-zinc-800/50 disabled:opacity-50 transition-all"
                >
                  {pdfFile ? (
                    <>
                      <FileText className="w-6 h-6 text-violet-400" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-zinc-200">{pdfFile.name}</p>
                        <p className="text-xs text-zinc-500">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload className="w-6 h-6" />
                      <div className="text-left">
                        <p className="text-sm font-medium">Upload PDF</p>
                        <p className="text-xs text-zinc-500">Click to select a file (max 10MB)</p>
                      </div>
                    </>
                  )}
                </button>
                {!extractedContent && pdfFile && (
                  <button
                    onClick={handleExtract}
                    disabled={isExtracting || !pdfFile}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded-lg hover:bg-violet-500/20 disabled:opacity-50 transition-all"
                  >
                    {isExtracting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Extracting content...
                      </>
                    ) : (
                      <>
                        <FileCheck className="w-4 h-4" />
                        Extract Content
                      </>
                    )}
                  </button>
                )}
              </div>
            ) : sourceType === "url" ? (
              /* Web URL Input */
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="url"
                    value={webUrl}
                    onChange={(e) => {
                      setWebUrl(e.target.value);
                      clearExtraction();
                    }}
                    placeholder="https://example.com/article"
                    disabled={isGenerating || isExtracting}
                    className="w-full px-4 py-3 pl-11 bg-zinc-900 border border-zinc-700 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:border-violet-500/50 focus:ring-violet-500/20 disabled:opacity-50"
                  />
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                </div>
                {!extractedContent && webUrl && (
                  <button
                    onClick={handleExtract}
                    disabled={isExtracting || !webUrl}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded-lg hover:bg-violet-500/20 disabled:opacity-50 transition-all"
                  >
                    {isExtracting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Fetching content...
                      </>
                    ) : (
                      <>
                        <FileCheck className="w-4 h-4" />
                        Extract Content
                      </>
                    )}
                  </button>
                )}
              </div>
            ) : null}

            {/* Extraction Error */}
            {extractionError && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl"
              >
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{extractionError.message}</p>
              </motion.div>
            )}

            {/* Extracted Content Preview */}
            {extractedContent?.success && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2"
              >
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-400">Content extracted</span>
                </div>
                {extractedContent.title && (
                  <p className="text-sm text-zinc-300 truncate">{extractedContent.title}</p>
                )}
                <p className="text-xs text-zinc-500">
                  {extractedContent.originalLength?.toLocaleString()} characters
                  {extractedContent.truncated && " (truncated)"}
                  {extractedContent.pageCount && ` • ${extractedContent.pageCount} pages`}
                  {extractedContent.wordCount && ` • ${extractedContent.wordCount.toLocaleString()} words`}
                </p>
              </motion.div>
            )}

            {/* Focus Prompt (for source-based generation) */}
            {sourceType !== "text" && extractedContent?.success && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-zinc-400">
                  <Target className="w-4 h-4" />
                  <span>What do you want to learn from this? (optional)</span>
                </label>
                <textarea
                  value={focusPrompt}
                  onChange={(e) => setFocusPrompt(e.target.value)}
                  placeholder="e.g., Focus on the main concepts and definitions, or Learn about the specific techniques mentioned..."
                  disabled={isGenerating}
                  className="w-full h-20 px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-zinc-100 placeholder-zinc-500 resize-none focus:outline-none focus:ring-2 focus:border-violet-500/50 focus:ring-violet-500/20 disabled:opacity-50"
                />
              </div>
            )}

            {/* Public toggle (only for new decks) */}
            {!isAddingToExisting && (
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  className={`relative w-10 h-6 rounded-full transition-colors ${
                    isPublic ? "bg-violet-500" : "bg-zinc-700"
                  }`}
                  onClick={() => setIsPublic(!isPublic)}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      isPublic ? "left-5" : "left-1"
                    }`}
                  />
                </div>
                <span className="text-sm text-zinc-300">
                  Make deck public (visible in Explore)
                </span>
              </label>
            )}

            {/* Suggestions (only for text mode) */}
            {sourceType === "text" && showSuggestions && !isGenerating && !result && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <Lightbulb className="w-4 h-4" />
                  <span>Try these examples:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {suggestions.map((category) => (
                    <div key={category.name} className="space-y-1">
                      <div className={`flex items-center gap-2 text-xs ${category.color}`}>
                        <category.icon className="w-3 h-3" />
                        <span>{category.name}</span>
                      </div>
                      {category.examples.slice(0, 2).map((example) => (
                        <button
                          key={example}
                          onClick={() => handleSuggestionClick(example)}
                          className="w-full text-left text-xs text-zinc-400 hover:text-zinc-200 px-2 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors truncate"
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Loading state */}
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-8"
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-violet-500/20" />
                  <Loader2 className="w-16 h-16 text-violet-500 animate-spin absolute inset-0" />
                </div>
                <p className="text-zinc-300 mt-4">Generating your flashcards...</p>
                <p className="text-xs text-zinc-500 mt-1">
                  This may take a few seconds
                </p>
              </motion.div>
            )}

            {/* Error state */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-400">Generation failed</p>
                  <p className="text-xs text-red-400/70 mt-1">{error.message}</p>
                </div>
              </motion.div>
            )}

            {/* Success state */}
            {result?.success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Check className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-emerald-400">
                      {result.message}
                    </p>
                    <p className="text-xs text-emerald-400/70 mt-0.5">
                      {result.cards.length} cards generated
                    </p>
                  </div>
                </div>

                {/* Preview cards */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {result.cards.slice(0, 5).map((card, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-zinc-900 rounded-lg"
                    >
                      <BookOpen className="w-4 h-4 text-zinc-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-300 truncate">{card.front}</p>
                        <p className="text-xs text-zinc-500 truncate mt-0.5">
                          {card.back}
                        </p>
                      </div>
                    </div>
                  ))}
                  {result.cards.length > 5 && (
                    <p className="text-xs text-zinc-500 text-center">
                      +{result.cards.length - 5} more cards
                    </p>
                  )}
                </div>
              </motion.div>
            )}
            </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-zinc-800">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              {result?.success ? "Close" : "Cancel"}
            </button>
            {isAuthenticated && !result?.success && (
              <button
                onClick={handleGenerate}
                disabled={
                  isGenerating ||
                  isExtracting ||
                  (sourceType === "text" && !prompt.trim()) ||
                  (sourceType === "youtube" && !youtubeUrl && !extractedContent?.content) ||
                  (sourceType === "pdf" && !pdfFile && !extractedContent?.content) ||
                  (sourceType === "url" && !webUrl && !extractedContent?.content)
                }
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-violet-500 to-purple-600 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : isExtracting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Extracting...
                  </>
                ) : sourceType !== "text" && !extractedContent?.content ? (
                  <>
                    <FileCheck className="w-4 h-4" />
                    Extract & Generate
                    <ChevronRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default AIGenerateModal;
