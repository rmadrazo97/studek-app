"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Highlighter,
  Copy,
  Sparkles,
  BookOpen,
  ClipboardList,
  Link2,
  X,
} from "lucide-react";
import { useCreationStudio, SourceDocument } from "@/stores/creationStudioStore";
import { Button } from "@/components/ui/Button";

interface SourceViewerProps {
  className?: string;
}

// Sample PDF content for demonstration
const samplePDFContent = [
  {
    page: 1,
    title: "The Mitochondria",
    content: `The mitochondria is often described as the "powerhouse of the cell." This organelle is responsible for producing adenosine triphosphate (ATP), the primary energy currency of the cell.

Mitochondria are unique among organelles because they contain their own DNA (mtDNA) and ribosomes, suggesting they were once free-living bacteria that entered into a symbiotic relationship with early eukaryotic cells - a theory known as endosymbiosis.

Key Functions:
• ATP production through oxidative phosphorylation
• Regulation of cellular metabolism
• Calcium storage and signaling
• Apoptosis (programmed cell death)
• Heat production

The inner membrane of mitochondria is highly folded into structures called cristae, which increase the surface area available for ATP synthesis. The electron transport chain, located in the inner membrane, is where most ATP is produced.`,
  },
  {
    page: 2,
    title: "Cellular Respiration",
    content: `Cellular respiration is the process by which cells break down glucose and other organic molecules to produce ATP. This process occurs in three main stages:

1. Glycolysis (Cytoplasm)
   - Glucose is split into two pyruvate molecules
   - Net gain of 2 ATP and 2 NADH
   - Does not require oxygen

2. Krebs Cycle (Mitochondrial Matrix)
   - Also known as the citric acid cycle
   - Pyruvate is converted to acetyl-CoA
   - Produces CO2, NADH, FADH2, and some ATP

3. Electron Transport Chain (Inner Mitochondrial Membrane)
   - NADH and FADH2 donate electrons
   - Creates a proton gradient
   - ATP synthase produces 26-28 ATP

The complete oxidation of one glucose molecule can produce approximately 30-32 ATP molecules, though the exact number varies based on cellular conditions.`,
  },
  {
    page: 3,
    title: "ATP Synthesis Mechanism",
    content: `ATP synthesis in mitochondria follows the chemiosmotic theory proposed by Peter Mitchell in 1961, for which he received the Nobel Prize.

The Proton Motive Force:
As electrons move through the electron transport chain complexes (I, II, III, and IV), protons (H+) are pumped from the mitochondrial matrix into the intermembrane space. This creates:
• A pH gradient (chemical potential)
• An electrical gradient (voltage difference)

Together, these form the proton motive force (PMF).

ATP Synthase:
This remarkable molecular machine consists of two main components:
• F0: The membrane-embedded portion that acts as a proton channel
• F1: The catalytic portion that synthesizes ATP

As protons flow back through ATP synthase down their concentration gradient, the enzyme rotates like a turbine, catalyzing the phosphorylation of ADP to ATP.

Formula: ADP + Pi + H+ → ATP + H2O

This rotation-based mechanism has been directly observed using single-molecule experiments.`,
  },
];

export function SourceViewer({ className = "" }: SourceViewerProps) {
  const {
    state,
    setSource,
    setSourceSelection,
  } = useCreationStudio();

  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [selectedText, setSelectedText] = useState("");
  const [selectionRect, setSelectionRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const totalPages = samplePDFContent.length;
  const currentContent = samplePDFContent[currentPage - 1];

  // Initialize source document
  useEffect(() => {
    if (!state.sourceDocument) {
      setSource({
        id: "sample-pdf-1",
        type: "pdf",
        title: "Cell Biology: Mitochondria and Energy Production",
        currentPage: 1,
        totalPages: 3,
      });
    }
  }, [state.sourceDocument, setSource]);

  // Handle text selection
  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setSelectedText("");
      setSelectionRect(null);
      setShowContextMenu(false);
      setSourceSelection(null);
      return;
    }

    const text = selection.toString().trim();
    if (text) {
      setSelectedText(text);

      // Get selection rectangle
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = contentRef.current?.getBoundingClientRect();

      if (containerRect) {
        setSelectionRect({
          x: rect.x - containerRect.x,
          y: rect.y - containerRect.y,
          width: rect.width,
          height: rect.height,
        });
        setShowContextMenu(true);
        setSourceSelection({
          text,
          sourceId: state.sourceDocument?.id,
          rect: {
            x: rect.x - containerRect.x,
            y: rect.y - containerRect.y,
            width: rect.width,
            height: rect.height,
          },
        });
      }
    }
  }, [setSourceSelection, state.sourceDocument?.id]);

  // Copy to clipboard
  const handleCopy = useCallback(() => {
    if (selectedText) {
      navigator.clipboard.writeText(selectedText);
      setShowContextMenu(false);
    }
  }, [selectedText]);

  // Navigate pages
  const goToPage = useCallback(
    (page: number) => {
      const newPage = Math.max(1, Math.min(totalPages, page));
      setCurrentPage(newPage);
      if (state.sourceDocument) {
        setSource({ ...state.sourceDocument, currentPage: newPage });
      }
    },
    [totalPages, state.sourceDocument, setSource]
  );

  // Zoom controls
  const handleZoomIn = () => setZoom((z) => Math.min(200, z + 25));
  const handleZoomOut = () => setZoom((z) => Math.max(50, z - 25));

  return (
    <div className={`flex flex-col h-full bg-[#0a0b0d] ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(148,163,184,0.1)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
            <FileText className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-200 truncate max-w-[200px]">
              {state.sourceDocument?.title || "No Document"}
            </h3>
            <p className="text-xs text-slate-500">PDF Document</p>
          </div>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg hover:bg-[rgba(148,163,184,0.1)] text-slate-400 hover:text-slate-200 transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-500 w-12 text-center">{zoom}%</span>
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg hover:bg-[rgba(148,163,184,0.1)] text-slate-400 hover:text-slate-200 transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content area */}
      <div
        ref={contentRef}
        className="flex-1 overflow-auto p-6 relative"
        onMouseUp={handleMouseUp}
      >
        {/* PDF-like content container */}
        <div
          className="max-w-3xl mx-auto bg-white rounded-lg shadow-2xl text-gray-900 p-8 transition-transform origin-top"
          style={{ transform: `scale(${zoom / 100})` }}
        >
          {/* Page header */}
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              {currentContent.title}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Chapter 3 - Cellular Energetics
            </p>
          </div>

          {/* Page content */}
          <div className="prose prose-gray max-w-none">
            {currentContent.content.split("\n\n").map((paragraph, idx) => (
              <p key={idx} className="text-base leading-relaxed text-gray-700 mb-4">
                {paragraph}
              </p>
            ))}
          </div>

          {/* Page number */}
          <div className="text-center text-sm text-gray-400 mt-8 pt-4 border-t border-gray-100">
            Page {currentPage}
          </div>
        </div>

        {/* Selection context menu */}
        <AnimatePresence>
          {showContextMenu && selectionRect && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50"
              style={{
                left: selectionRect.x + selectionRect.width / 2,
                top: selectionRect.y - 8,
                transform: "translate(-50%, -100%)",
              }}
            >
              <div className="flex items-center gap-1 p-1.5 rounded-xl bg-[#1a1d23] border border-[rgba(148,163,184,0.2)] shadow-xl">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:bg-[rgba(148,163,184,0.1)] hover:text-white transition-colors"
                  title="Copy"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>
                <div className="w-px h-5 bg-[rgba(148,163,184,0.2)]" />
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:bg-[rgba(148,163,184,0.1)] hover:text-cyan-400 transition-colors"
                  title="Highlight"
                >
                  <Highlighter className="w-3.5 h-3.5" />
                </button>
                <div className="w-px h-5 bg-[rgba(148,163,184,0.2)]" />
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-cyan-400 hover:bg-cyan-400/10 transition-colors"
                  title="Create Flashcard"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Flashcard</span>
                </button>
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-violet-400 hover:bg-violet-400/10 transition-colors"
                  title="Generate Quiz"
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  <span>Quiz</span>
                </button>
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-emerald-400 hover:bg-emerald-400/10 transition-colors"
                  title="Add to Notes"
                >
                  <Link2 className="w-3.5 h-3.5" />
                </button>
                <div className="w-px h-5 bg-[rgba(148,163,184,0.2)]" />
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:bg-[rgba(148,163,184,0.1)] hover:text-violet-400 transition-colors"
                  title="Ask AI"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ask AI</span>
                </button>
                <button
                  onClick={() => setShowContextMenu(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-[rgba(148,163,184,0.1)] hover:text-slate-300 transition-colors ml-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-[rgba(148,163,184,0.1)] bg-[#0d0e11]">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          icon={<ChevronLeft className="w-4 h-4" />}
        >
          Previous
        </Button>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Page</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={currentPage}
            onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
            className="w-12 px-2 py-1 text-center text-sm bg-[#161a1f] border border-[rgba(148,163,184,0.15)] rounded-lg text-slate-200 focus:outline-none focus:border-cyan-400/50"
          />
          <span className="text-sm text-slate-400">of {totalPages}</span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          icon={<ChevronRight className="w-4 h-4" />}
          iconPosition="right"
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export default SourceViewer;
