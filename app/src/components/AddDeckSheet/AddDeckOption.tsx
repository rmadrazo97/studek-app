"use client";

import { motion } from "framer-motion";
import type { AddDeckOptionProps } from "./types";

export function AddDeckOption({
  icon,
  title,
  subtitle,
  onPress,
  isPrimary = false,
}: AddDeckOptionProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98, opacity: 0.9 }}
      onClick={onPress}
      className={`
        w-full flex items-center gap-4 p-4 rounded-2xl
        text-left transition-colors duration-200
        ${
          isPrimary
            ? "bg-cyan-500/15 border border-cyan-500/30 hover:bg-cyan-500/20"
            : "bg-zinc-800/80 border border-zinc-700/50 hover:bg-zinc-800"
        }
      `}
    >
      <div
        className={`
          w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
          ${isPrimary ? "bg-cyan-500/20" : "bg-zinc-700/50"}
        `}
      >
        <span className="text-cyan-400">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-[17px] font-semibold text-white">{title}</h3>
        <p className="text-[14px] text-zinc-400 mt-0.5">{subtitle}</p>
      </div>
    </motion.button>
  );
}
