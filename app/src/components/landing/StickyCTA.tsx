"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function StickyCTA() {
  const { scrollYProgress } = useScroll();

  // Show after scrolling 20% and hide at 95%
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.15, 0.2, 0.9, 0.95],
    [0, 0, 1, 1, 0]
  );

  const y = useTransform(
    scrollYProgress,
    [0, 0.15, 0.2],
    [100, 100, 0]
  );

  return (
    <motion.div
      style={{ opacity, y }}
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
    >
      {/* Gradient fade background */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#08090a] via-[#08090a]/95 to-transparent pointer-events-none" style={{ height: '150%', bottom: 0 }} />

      <div className="relative bg-[#08090a]/95 backdrop-blur-xl border-t border-[rgba(148,163,184,0.1)] px-4 py-3 safe-area-inset-bottom">
        <div className="flex items-center gap-3">
          {/* Mini value prop */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 truncate">
              Start free. No credit card needed.
            </p>
          </div>

          {/* CTA Button */}
          <Link href="/register" className="flex-shrink-0">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-shadow">
              Start Free
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
