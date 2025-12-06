"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  X,
  Send,
  Lightbulb,
  FileText,
  BookOpen,
  ClipboardList,
  Loader2,
  ArrowRight,
  Copy,
  Check,
  GripVertical,
} from "lucide-react";
import { useCreationStudio } from "@/stores/creationStudioStore";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isDraggable?: boolean;
}

interface AISidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Simulated AI responses
const simulatedResponses: Record<string, string> = {
  summarize:
    "The mitochondria is the powerhouse of the cell, responsible for producing ATP through cellular respiration. Key points include:\n\n• Contains its own DNA (mtDNA)\n• Inner membrane is highly folded (cristae)\n• ATP synthesis occurs via chemiosmosis\n• Critical for energy metabolism",
  flashcards:
    "I've generated 3 flashcards based on the source material:\n\n1. Q: What is the primary function of mitochondria?\nA: To produce ATP (adenosine triphosphate) through cellular respiration.\n\n2. Q: What are cristae?\nA: Folds in the inner mitochondrial membrane that increase surface area for ATP synthesis.\n\n3. Q: What is the chemiosmotic theory?\nA: The theory that ATP synthesis is driven by a proton gradient across the inner mitochondrial membrane.",
  explain:
    "Let me break this down simply:\n\nThink of the mitochondria like a power plant in a city. Just as a power plant converts fuel into electricity that powers homes and businesses, the mitochondria converts glucose (sugar from food) into ATP - the energy currency your cells use for everything.\n\nThe 'cristae' are like having more solar panels - the folds increase surface area to generate more power!",
  quiz: "Here's a practice quiz question:\n\n**Question:** Which of the following correctly describes the role of ATP synthase?\n\nA) It breaks down glucose in the cytoplasm\nB) It uses the proton gradient to phosphorylate ADP to ATP\nC) It transports oxygen across the cell membrane\nD) It synthesizes proteins from amino acids\n\n**Correct Answer:** B",
};

export function AISidebar({ isOpen, onClose }: AISidebarProps) {
  const { state, startAIStream, appendAIStream, endAIStream, acceptAISuggestion } = useCreationStudio();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [draggedContent, setDraggedContent] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Simulate AI streaming response
  const simulateStreaming = useCallback(
    async (text: string) => {
      const words = text.split(" ");
      let content = "";

      for (let i = 0; i < words.length; i++) {
        content += (i > 0 ? " " : "") + words[i];
        await new Promise((resolve) => setTimeout(resolve, 30 + Math.random() * 20));

        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.role === "assistant") {
            lastMessage.content = content;
          }
          return newMessages;
        });
      }
    },
    []
  );

  // Handle sending a message
  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Math.random().toString(36).substring(7),
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Add placeholder assistant message
    const assistantMessage: Message = {
      id: Math.random().toString(36).substring(7),
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isDraggable: true,
    };
    setMessages((prev) => [...prev, assistantMessage]);

    // Determine response based on input
    let response = "I can help you study more effectively! Try asking me to:\n\n• Summarize the content\n• Generate flashcards\n• Create a quiz\n• Explain a concept simply";

    const lowerInput = inputValue.toLowerCase();
    if (lowerInput.includes("summarize") || lowerInput.includes("summary")) {
      response = simulatedResponses.summarize;
    } else if (lowerInput.includes("flashcard") || lowerInput.includes("cards")) {
      response = simulatedResponses.flashcards;
    } else if (lowerInput.includes("explain") || lowerInput.includes("simple")) {
      response = simulatedResponses.explain;
    } else if (lowerInput.includes("quiz") || lowerInput.includes("question")) {
      response = simulatedResponses.quiz;
    }

    // Simulate streaming
    await simulateStreaming(response);
    setIsLoading(false);
  }, [inputValue, isLoading, simulateStreaming]);

  // Quick action handlers
  const handleQuickAction = useCallback(
    async (action: string) => {
      if (isLoading) return;

      const prompts: Record<string, string> = {
        summarize: "Summarize the key concepts from the source material",
        flashcards: "Generate flashcards from the source content",
        explain: "Explain the main concept in simple terms",
        quiz: "Create a practice quiz question",
      };

      setInputValue(prompts[action] || "");

      // Auto-send after a brief delay
      setTimeout(() => {
        const input = prompts[action];
        if (input) {
          const userMessage: Message = {
            id: Math.random().toString(36).substring(7),
            role: "user",
            content: input,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, userMessage]);

          const assistantMessage: Message = {
            id: Math.random().toString(36).substring(7),
            role: "assistant",
            content: "",
            timestamp: new Date(),
            isDraggable: true,
          };
          setMessages((prev) => [...prev, assistantMessage]);
          setIsLoading(true);

          simulateStreaming(simulatedResponses[action] || "").then(() => {
            setIsLoading(false);
          });
        }
      }, 100);
      setInputValue("");
    },
    [isLoading, simulateStreaming]
  );

  // Copy to clipboard
  const handleCopy = useCallback((content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  // Drag and drop to editor
  const handleDragStart = (e: React.DragEvent, content: string) => {
    e.dataTransfer.setData("text/plain", content);
    setDraggedContent(content);
  };

  const handleDragEnd = () => {
    setDraggedContent(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed right-0 top-0 bottom-0 w-96 bg-[#0f1115] border-l border-[rgba(148,163,184,0.1)] shadow-2xl z-40 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(148,163,184,0.1)]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">AI Co-pilot</h3>
                <p className="text-xs text-slate-500">Ask questions about your content</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[rgba(148,163,184,0.1)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick actions */}
          <div className="p-3 border-b border-[rgba(148,163,184,0.1)]">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleQuickAction("summarize")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[rgba(148,163,184,0.1)] text-slate-300 hover:bg-cyan-500/20 hover:text-cyan-300 transition-colors"
              >
                <FileText className="w-3 h-3" />
                Summarize
              </button>
              <button
                onClick={() => handleQuickAction("flashcards")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[rgba(148,163,184,0.1)] text-slate-300 hover:bg-cyan-500/20 hover:text-cyan-300 transition-colors"
              >
                <BookOpen className="w-3 h-3" />
                Flashcards
              </button>
              <button
                onClick={() => handleQuickAction("explain")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[rgba(148,163,184,0.1)] text-slate-300 hover:bg-amber-500/20 hover:text-amber-300 transition-colors"
              >
                <Lightbulb className="w-3 h-3" />
                Explain Simply
              </button>
              <button
                onClick={() => handleQuickAction("quiz")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[rgba(148,163,184,0.1)] text-slate-300 hover:bg-violet-500/20 hover:text-violet-300 transition-colors"
              >
                <ClipboardList className="w-3 h-3" />
                Quiz Me
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-violet-400" />
                </div>
                <h4 className="text-sm font-medium text-slate-200 mb-2">
                  Your AI Study Assistant
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Ask questions about your source material, generate flashcards, or get explanations.
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`
                    max-w-[85%] rounded-2xl px-4 py-3 relative group
                    ${message.role === "user"
                      ? "bg-cyan-500/20 text-cyan-100"
                      : "bg-[rgba(148,163,184,0.1)] text-slate-200"
                    }
                  `}
                >
                  {/* Drag handle for assistant messages */}
                  {message.role === "assistant" && message.isDraggable && message.content && (
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, message.content)}
                      onDragEnd={handleDragEnd}
                      className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-1 rounded bg-[rgba(148,163,184,0.1)]"
                    >
                      <GripVertical className="w-4 h-4 text-slate-500" />
                    </div>
                  )}

                  {/* Message content */}
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>

                  {/* Loading indicator */}
                  {message.role === "assistant" && !message.content && isLoading && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-xs">Thinking...</span>
                    </div>
                  )}

                  {/* Action buttons for assistant messages */}
                  {message.role === "assistant" && message.content && (
                    <div className="flex items-center gap-1 mt-2 pt-2 border-t border-[rgba(148,163,184,0.1)]">
                      <button
                        onClick={() => handleCopy(message.content, message.id)}
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs text-slate-400 hover:text-slate-200 hover:bg-[rgba(148,163,184,0.1)] transition-colors"
                      >
                        {copiedId === message.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        {copiedId === message.id ? "Copied!" : "Copy"}
                      </button>
                      <button className="flex items-center gap-1 px-2 py-1 rounded text-xs text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 transition-colors">
                        <ArrowRight className="w-3 h-3" />
                        Add to Notes
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-[rgba(148,163,184,0.1)]">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask about the source material..."
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[rgba(0,0,0,0.3)] text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-400/50 disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className="p-2.5 rounded-xl bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2 text-center">
              Drag AI responses into your notes, or use quick actions above
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AISidebar;
