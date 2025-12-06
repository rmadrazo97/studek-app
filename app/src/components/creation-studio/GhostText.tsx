"use client";

import { motion } from "framer-motion";

interface GhostTextProps {
  text: string;
  className?: string;
}

export function GhostText({ text, className = "" }: GhostTextProps) {
  if (!text) return null;

  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`
        text-violet-400/60 italic pointer-events-none select-none
        ${className}
      `}
    >
      {text}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
        className="inline-block w-0.5 h-4 bg-violet-400 ml-0.5 align-middle"
      />
    </motion.span>
  );
}

export default GhostText;
