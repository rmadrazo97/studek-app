"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  X,
  Send,
  Lightbulb,
  Brain,
  HelpCircle,
  Loader2,
} from "lucide-react";
import { useReview } from "@/stores/reviewStore";

interface AITutorOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const presetPrompts = [
  {
    icon: Lightbulb,
    label: "Explain simply",
    prompt: "Explain this like I'm 5",
    color: "text-yellow-400",
  },
  {
    icon: Brain,
    label: "Mnemonic",
    prompt: "Give me a mnemonic to remember this",
    color: "text-violet-400",
  },
  {
    icon: HelpCircle,
    label: "Why did I miss this?",
    prompt: "Why might I have gotten this wrong and how can I remember it better?",
    color: "text-rose-400",
  },
];

export function AITutorOverlay({ isOpen, onClose }: AITutorOverlayProps) {
  const { state } = useReview();
  const { currentCard } = state;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (prompt: string) => {
    if (!prompt.trim() || !currentCard) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: prompt,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response (in production, this would call your AI API)
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: getSimulatedResponse(prompt, currentCard.front, currentCard.back),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const getSimulatedResponse = (prompt: string, front: string, back: string): string => {
    if (prompt.toLowerCase().includes("explain") || prompt.toLowerCase().includes("simple")) {
      return `Think of it this way: "${back}" is the answer to "${front}". Imagine you're explaining this to a friend - the key concept here is understanding the relationship between the question and answer. Try to visualize it or connect it to something you already know!`;
    }
    if (prompt.toLowerCase().includes("mnemonic")) {
      return `Here's a memory trick: Take the first letters of the key words in "${back}" and create a silly sentence or image. The more absurd, the better you'll remember it! You could also try the memory palace technique - place this concept in a familiar location in your mind.`;
    }
    if (prompt.toLowerCase().includes("miss") || prompt.toLowerCase().includes("wrong")) {
      return `Common reasons for missing this:\n\n1. **Similar concepts** - There might be related information that's causing confusion\n2. **Not enough context** - Try adding more details to your mental model\n3. **Shallow encoding** - Next time, try to explain it in your own words\n\nTip: When you see this card again, pause and really think about WHY the answer is what it is.`;
    }
    return `Great question! The key thing to understand about "${front}" is that ${back}. Let me know if you'd like me to break this down further or explain it from a different angle.`;
  };

  const handlePresetClick = (prompt: string) => {
    handleSend(prompt);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[70vh] bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-800 rounded-t-3xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-100">AI Tutor</h3>
                  <p className="text-xs text-zinc-500">
                    Ask anything about this card
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[40vh]">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-zinc-500 text-sm mb-6">
                    Choose a quick prompt or ask your own question
                  </p>
                  {/* Preset prompts */}
                  <div className="flex flex-wrap justify-center gap-2">
                    {presetPrompts.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => handlePresetClick(preset.prompt)}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 rounded-full text-sm text-zinc-300 transition-colors"
                      >
                        <preset.icon className={`w-4 h-4 ${preset.color}`} />
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                        message.role === "user"
                          ? "bg-cyan-600 text-white"
                          : "bg-zinc-800 text-zinc-100"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-zinc-800 px-4 py-3 rounded-2xl">
                    <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                  </div>
                </div>
              )}
            </div>

            {/* Quick prompts (shown after conversation started) */}
            {messages.length > 0 && (
              <div className="px-4 py-2 border-t border-zinc-800/50">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {presetPrompts.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => handlePresetClick(preset.prompt)}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 rounded-full text-xs text-zinc-400 transition-colors"
                    >
                      <preset.icon className={`w-3 h-3 ${preset.color}`} />
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-zinc-800">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(input);
                }}
                className="flex gap-3"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask the AI tutor..."
                  className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all"
                >
                  <Send className="w-5 h-5 text-white" />
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Floating trigger button component
export function AITutorButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="fixed bottom-32 right-6 z-30 w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-500 shadow-lg shadow-cyan-500/25 flex items-center justify-center"
      title="AI Tutor (A)"
    >
      <Sparkles className="w-6 h-6 text-white" />
    </motion.button>
  );
}
