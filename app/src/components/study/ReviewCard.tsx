"use client";

import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, ZoomIn, Volume2, VolumeX } from "lucide-react";
import { useReview } from "@/stores/reviewStore";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ReviewCardProps {}

// Pre-generate waveform heights to avoid Math.random() during render
function generateWaveformHeights(count: number): number[][] {
  return Array.from({ length: count }, () => [
    Math.random() * 20 + 10,
    Math.random() * 30 + 10,
    Math.random() * 20 + 10,
  ]);
}

export function ReviewCard(_props: ReviewCardProps) {
  const { state } = useReview();
  const { currentCard, status } = state;
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Memoize waveform heights to maintain purity
  const waveformHeights = useMemo(() => generateWaveformHeights(30), []);

  if (!currentCard) return null;

  const handleCopyCode = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isAudioPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsAudioPlaying(!isAudioPlaying);
    }
  };

  // Parse content for code blocks (simplified - in production use a proper parser)
  const renderContent = (content: string) => {
    // Check for code blocks
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push(
          <span key={lastIndex} className="whitespace-pre-wrap">
            {content.slice(lastIndex, match.index)}
          </span>
        );
      }

      // Add code block
      const language = match[1] || "text";
      const code = match[2].trim();
      const codeId = `code-${match.index}`;

      parts.push(
        <div key={codeId} className="relative group my-4">
          <div className="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
              {language}
            </span>
            <button
              onClick={() => handleCopyCode(code, codeId)}
              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              {copiedCode === codeId ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
          <pre className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 overflow-x-auto">
            <code className="text-sm font-mono text-zinc-300">{code}</code>
          </pre>
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(
        <span key={lastIndex} className="whitespace-pre-wrap">
          {content.slice(lastIndex)}
        </span>
      );
    }

    return parts.length > 0 ? parts : content;
  };

  return (
    <>
      {/* Card Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[800px] mx-auto"
      >
        <motion.div
          animate={{
            scale: status === "back" ? [0.98, 1] : 1,
          }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden"
        >
          {/* Card Content */}
          <div className="p-6 sm:p-8 md:p-10 max-h-[calc(80vh-200px)] overflow-y-auto">
            {/* Front (Question) */}
            <div className="text-center">
              {/* Media */}
              {currentCard.media && status === "front" && (
                <div className="mb-6">
                  {currentCard.media.type === "image" && (
                    <div className="relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={currentCard.media.url}
                        alt="Card media"
                        className="max-w-full h-auto max-h-[300px] mx-auto rounded-xl cursor-zoom-in"
                        onClick={() => setLightboxImage(currentCard.media!.url)}
                      />
                      <button
                        onClick={() => setLightboxImage(currentCard.media!.url)}
                        className="absolute top-2 right-2 p-2 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ZoomIn className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  )}
                  {currentCard.media.type === "audio" && (
                    <div className="flex items-center justify-center gap-4 p-4 bg-zinc-950 rounded-xl">
                      <button
                        onClick={toggleAudio}
                        className="p-4 bg-cyan-500/20 hover:bg-cyan-500/30 rounded-full transition-colors"
                      >
                        {isAudioPlaying ? (
                          <VolumeX className="w-6 h-6 text-cyan-400" />
                        ) : (
                          <Volume2 className="w-6 h-6 text-cyan-400" />
                        )}
                      </button>
                      <div className="flex-1 h-12 bg-zinc-800 rounded-lg flex items-center px-4">
                        {/* Audio waveform visualization (simplified) */}
                        <div className="flex items-center gap-1 h-full">
                          {waveformHeights.map((heights, i) => (
                            <motion.div
                              key={i}
                              animate={{
                                height: isAudioPlaying ? heights : 8,
                              }}
                              transition={{
                                duration: 0.3,
                                repeat: isAudioPlaying ? Infinity : 0,
                                delay: i * 0.02,
                              }}
                              className="w-1 bg-cyan-400 rounded-full"
                            />
                          ))}
                        </div>
                      </div>
                      <audio
                        ref={audioRef}
                        src={currentCard.media.url}
                        onEnded={() => setIsAudioPlaying(false)}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Question Text */}
              <div className="text-xl sm:text-2xl font-medium text-zinc-100 leading-relaxed">
                {renderContent(currentCard.front)}
              </div>

              {/* Tags */}
              {currentCard.tags.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mt-6">
                  {currentCard.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 text-xs bg-zinc-800 text-zinc-400 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Divider & Answer */}
            <AnimatePresence>
              {status === "back" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Divider */}
                  <div className="my-8 flex items-center gap-4">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
                    <span className="text-xs text-zinc-600 uppercase tracking-wider">
                      Answer
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
                  </div>

                  {/* Answer Content */}
                  <div className="text-center text-xl sm:text-2xl font-medium text-zinc-100 leading-relaxed">
                    {renderContent(currentCard.back)}
                  </div>

                  {/* Answer Media */}
                  {currentCard.media && currentCard.media.type === "image" && (
                    <div className="mt-6 flex justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={currentCard.media.url}
                        alt="Answer media"
                        className="max-w-full h-auto max-h-[300px] rounded-xl cursor-zoom-in"
                        onClick={() => setLightboxImage(currentCard.media!.url)}
                      />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Deck Info */}
          <div className="px-6 py-3 border-t border-zinc-800/50 bg-zinc-950/50">
            <p className="text-xs text-zinc-600 text-center truncate">
              {currentCard.deckName}
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={lightboxImage}
              alt="Enlarged"
              className="max-w-full max-h-full object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
