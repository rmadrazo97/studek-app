"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  PanelLeft,
  Sparkles,
  ChevronLeft,
  Download,
  Share2,
  MoreHorizontal,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { CreationStudioProvider, useCreationStudio } from "@/stores/creationStudioStore";
import {
  ResizableSplitPane,
  SourceViewer,
  BlockEditor,
  AISidebar,
} from "@/components/creation-studio";
import { Button } from "@/components/ui/Button";

function CreationStudioContent() {
  const router = useRouter();
  const { undo, redo, saveSnapshot } = useCreationStudio();
  const [showAISidebar, setShowAISidebar] = useState(false);
  const [showSourcePane, setShowSourcePane] = useState(true);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Z for undo
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Cmd/Ctrl + Shift + Z for redo
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        redo();
      }

      // Cmd/Ctrl + S for save
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        saveSnapshot();
        // Show save toast
      }

      // Cmd/Ctrl + J for AI sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === "j") {
        e.preventDefault();
        setShowAISidebar((prev) => !prev);
      }

      // Cmd/Ctrl + \ for toggle source pane
      if ((e.metaKey || e.ctrlKey) && e.key === "\\") {
        e.preventDefault();
        setShowSourcePane((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, saveSnapshot]);

  const handleExport = useCallback(() => {
    // Export functionality would go here
    console.log("Exporting document...");
  }, []);

  const handleShare = useCallback(() => {
    // Share functionality would go here
    console.log("Sharing document...");
  }, []);

  return (
    <div className="h-screen flex flex-col bg-[#08090a] overflow-hidden">
      {/* Top navigation bar */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-[rgba(148,163,184,0.1)] bg-[#0d0e11] z-20">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
            icon={<ChevronLeft className="w-4 h-4" />}
          >
            Back
          </Button>

          <div className="h-6 w-px bg-[rgba(148,163,184,0.15)]" />

          <button
            onClick={() => setShowSourcePane(!showSourcePane)}
            className={`p-2 rounded-lg transition-colors ${
              showSourcePane
                ? "text-cyan-400 bg-cyan-400/10"
                : "text-slate-400 hover:text-slate-200 hover:bg-[rgba(148,163,184,0.1)]"
            }`}
            title="Toggle source panel (Cmd+\\)"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAISidebar(!showAISidebar)}
            icon={<Sparkles className={`w-4 h-4 ${showAISidebar ? "text-violet-400" : ""}`} />}
            className={showAISidebar ? "bg-violet-400/10 text-violet-400" : ""}
          >
            AI Co-pilot
          </Button>

          <div className="h-6 w-px bg-[rgba(148,163,184,0.15)]" />

          <button
            onClick={handleExport}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[rgba(148,163,184,0.1)] transition-colors"
            title="Export"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={handleShare}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[rgba(148,163,184,0.1)] transition-colors"
            title="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[rgba(148,163,184,0.1)] transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex-1 overflow-hidden relative">
        {showSourcePane ? (
          <ResizableSplitPane
            leftPane={<SourceViewer />}
            rightPane={<BlockEditor />}
            defaultRatio={0.4}
            minLeftWidth={300}
            minRightWidth={400}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full"
          >
            <BlockEditor />
          </motion.div>
        )}

        {/* AI Sidebar */}
        <AISidebar isOpen={showAISidebar} onClose={() => setShowAISidebar(false)} />
      </div>

      {/* Keyboard shortcuts hint (visible on first visit) */}
      <div className="fixed bottom-4 left-4 flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-[rgba(148,163,184,0.1)] font-mono">/</kbd>
          Commands
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-[rgba(148,163,184,0.1)] font-mono">Cmd+J</kbd>
          AI
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-[rgba(148,163,184,0.1)] font-mono">Cmd+\</kbd>
          Toggle Source
        </span>
      </div>
    </div>
  );
}

export default function CreationStudioPage() {
  return (
    <CreationStudioProvider>
      <CreationStudioContent />
    </CreationStudioProvider>
  );
}
