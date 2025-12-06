"use client";

import { useState, useRef, useCallback, useEffect, ReactNode, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GripVertical, ChevronUp, ChevronDown, FileText } from "lucide-react";
import { useCreationStudio } from "@/stores/creationStudioStore";

interface ResizableSplitPaneProps {
  leftPane: ReactNode;
  rightPane: ReactNode;
  minLeftWidth?: number;
  minRightWidth?: number;
  defaultRatio?: number;
}

// Memoized pane wrappers to prevent unnecessary re-renders
const LeftPaneWrapper = memo(function LeftPaneWrapper({
  children,
  width,
}: {
  children: ReactNode;
  width: string;
}) {
  return (
    <div
      className="h-full overflow-hidden flex flex-col"
      style={{ width, minWidth: "200px" }}
    >
      {children}
    </div>
  );
});

const RightPaneWrapper = memo(function RightPaneWrapper({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex-1 h-full overflow-hidden flex flex-col min-w-[300px]">
      {children}
    </div>
  );
});

export function ResizableSplitPane({
  leftPane,
  rightPane,
  minLeftWidth = 200,
  minRightWidth = 300,
  defaultRatio = 0.4,
}: ResizableSplitPaneProps) {
  const { state, setPaneRatio, toggleSourceDrawer, setMobile } = useCreationStudio();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  // Initialize from store or default
  const ratio = state.paneSplitRatio || defaultRatio;

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [setMobile]);

  // Measure container
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // Handle drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newLeftWidth = e.clientX - containerRect.left;
      const totalWidth = containerRect.width;

      // Calculate ratio with constraints
      let newRatio = newLeftWidth / totalWidth;
      const minRatio = minLeftWidth / totalWidth;
      const maxRatio = 1 - minRightWidth / totalWidth;

      newRatio = Math.max(minRatio, Math.min(maxRatio, newRatio));
      setPaneRatio(newRatio);
    },
    [isDragging, minLeftWidth, minRightWidth, setPaneRatio]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Attach mouse events to window
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Mobile drawer layout
  if (state.isMobile) {
    return (
      <div className="flex flex-col h-full relative">
        {/* Main content (Editor) */}
        <div className="flex-1 overflow-hidden">{rightPane}</div>

        {/* Source Drawer Toggle */}
        <motion.button
          onClick={toggleSourceDrawer}
          className="fixed bottom-4 left-4 z-40 flex items-center gap-2 px-4 py-3 rounded-full glass border border-[rgba(148,163,184,0.15)] hover:border-cyan-400/40 transition-all shadow-lg"
          whileTap={{ scale: 0.95 }}
        >
          <FileText className="w-5 h-5 text-cyan-400" />
          <span className="text-sm text-slate-300">Source</span>
          <motion.span
            animate={{ rotate: state.isSourceDrawerOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronUp className="w-4 h-4 text-slate-400" />
          </motion.span>
        </motion.button>

        {/* Source Drawer */}
        <AnimatePresence>
          {state.isSourceDrawerOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={toggleSourceDrawer}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              />

              {/* Drawer */}
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 h-[70vh] bg-[#0f1115] rounded-t-3xl z-50 overflow-hidden border-t border-[rgba(148,163,184,0.15)]"
              >
                {/* Drawer handle */}
                <div className="flex justify-center py-3">
                  <button
                    onClick={toggleSourceDrawer}
                    className="w-12 h-1 bg-slate-600 rounded-full hover:bg-slate-500 transition-colors"
                  />
                </div>

                {/* Drawer content */}
                <div className="h-[calc(100%-40px)] overflow-auto">{leftPane}</div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Desktop split-pane layout
  const leftWidth = `${ratio * 100}%`;

  return (
    <div ref={containerRef} className="flex h-full w-full overflow-hidden">
      {/* Left Pane (Source) */}
      <LeftPaneWrapper width={leftWidth}>{leftPane}</LeftPaneWrapper>

      {/* Resizer */}
      <div
        className={`
          relative w-1 flex-shrink-0 cursor-col-resize group
          ${isDragging ? "bg-cyan-400" : "bg-[rgba(148,163,184,0.15)]"}
          hover:bg-cyan-400/50 transition-colors
        `}
        onMouseDown={handleMouseDown}
      >
        {/* Visual grip handle */}
        <div
          className={`
            absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
            w-6 h-16 rounded-full flex items-center justify-center
            ${isDragging ? "bg-cyan-400/20" : "bg-transparent"}
            group-hover:bg-cyan-400/10 transition-colors
          `}
        >
          <GripVertical
            className={`
              w-4 h-4
              ${isDragging ? "text-cyan-400" : "text-slate-600"}
              group-hover:text-cyan-400/70 transition-colors
            `}
          />
        </div>

        {/* Extended hit area */}
        <div className="absolute inset-y-0 -left-2 -right-2" />
      </div>

      {/* Right Pane (Editor) */}
      <RightPaneWrapper>{rightPane}</RightPaneWrapper>
    </div>
  );
}

export default ResizableSplitPane;
