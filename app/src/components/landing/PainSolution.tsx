"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { X, Check, AlertTriangle, Sparkles, FileText, Youtube, Globe } from "lucide-react";
import Link from "next/link";

export function PainSolution() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative py-16 sm:py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0a0b0d]">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-16 lg:mb-20"
        >
          <span className="text-cyan-400 text-xs sm:text-sm font-medium tracking-wider uppercase">
            The Problem
          </span>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-100 mt-3 sm:mt-4">
            Learning tools shouldn&apos;t fight you
          </h2>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base lg:text-lg text-slate-400 max-w-2xl mx-auto">
            You want to study. Not configure plugins, edit CSS, or manually type hundreds of cards.
          </p>
        </motion.div>

        {/* Comparison Grid */}
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* The Old Way */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="h-full rounded-xl sm:rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent p-5 sm:p-6 lg:p-8">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-lg sm:rounded-xl bg-red-500/10 flex items-center justify-center">
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                </div>
                <span className="text-base sm:text-lg font-semibold text-slate-300">The Old Way</span>
              </div>

              {/* Mock Anki UI - Simplified on mobile */}
              <div className="rounded-lg sm:rounded-xl bg-[#2d2d2d] border border-slate-700/50 overflow-hidden mb-4 sm:mb-6">
                {/* Title bar */}
                <div className="bg-[#3d3d3d] px-2 sm:px-3 py-1.5 sm:py-2 border-b border-slate-700/50">
                  <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-400 truncate">
                    <span>Anki - Browse (1 of 2847 cards selected)</span>
                  </div>
                </div>
                {/* Menu bar - hidden on very small screens */}
                <div className="hidden sm:flex bg-[#353535] px-2 py-1 border-b border-slate-700/50 gap-4 text-xs text-slate-500">
                  <span>File</span>
                  <span>Edit</span>
                  <span>View</span>
                  <span>Cards</span>
                  <span>Notes</span>
                  <span>Tools</span>
                </div>
                {/* Content */}
                <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                  <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                    <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-[#4a4a4a] rounded text-[9px] sm:text-[10px] text-slate-400">deck:&quot;Medical&quot;</span>
                    <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-[#4a4a4a] rounded text-[9px] sm:text-[10px] text-slate-400">tag:biochem</span>
                    <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-[#4a4a4a] rounded text-[9px] sm:text-[10px] text-slate-400">is:new</span>
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-slate-500 font-mono truncate">
                    SELECT * FROM notes WHERE deck_id = 1532...
                  </div>
                </div>
              </div>

              {/* Pain Points */}
              <ul className="space-y-2.5 sm:space-y-3 lg:space-y-4">
                {[
                  "Manual card creation takes hours",
                  "CSS hacks for readable formatting",
                  "Plugin conflicts break your workflow",
                  "Steep learning curve intimidates beginners",
                  "Mobile app costs $25 on iOS",
                ].map((pain, i) => (
                  <li key={i} className="flex items-start gap-2 sm:gap-3">
                    <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-400 text-xs sm:text-sm">{pain}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* The Studek Way */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="h-full rounded-xl sm:rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-violet-500/5 p-5 sm:p-6 lg:p-8">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-lg sm:rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                </div>
                <span className="text-base sm:text-lg font-semibold text-slate-300">The Studek Way</span>
              </div>

              {/* Magic Import Demo */}
              <div className="rounded-lg sm:rounded-xl bg-[#0f1115] border border-[rgba(148,163,184,0.08)] overflow-hidden mb-4 sm:mb-6">
                {/* Drop Zone */}
                <div className="p-4 sm:p-5 lg:p-6 border-b border-[rgba(148,163,184,0.08)]">
                  <div className="border-2 border-dashed border-cyan-500/30 rounded-lg sm:rounded-xl p-5 sm:p-6 lg:p-8 text-center hover:border-cyan-500/50 transition-colors cursor-pointer">
                    <div className="flex justify-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                      >
                        <FileText className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-red-400" />
                      </motion.div>
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                      >
                        <Youtube className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-red-500" />
                      </motion.div>
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                      >
                        <Globe className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-blue-400" />
                      </motion.div>
                    </div>
                    <p className="text-slate-300 font-medium text-sm sm:text-base">Drop your files here</p>
                    <p className="text-slate-500 text-xs sm:text-sm mt-1">PDF, YouTube URL, or any webpage</p>
                  </div>
                </div>

                {/* Processing indicator */}
                <div className="p-3 sm:p-4 bg-[#161a1f]/50">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-xs sm:text-sm text-slate-400">
                      AI generating <span className="text-cyan-400">24 cards</span> from your PDF...
                    </span>
                  </div>
                  <div className="mt-2 sm:mt-3 h-1 sm:h-1.5 bg-[#0f1115] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
                      initial={{ width: "0%" }}
                      animate={isInView ? { width: "75%" } : {}}
                      transition={{ duration: 2, delay: 0.5 }}
                    />
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <ul className="space-y-2.5 sm:space-y-3 lg:space-y-4">
                {[
                  "AI generates cards in seconds",
                  "Beautiful formatting out of the box",
                  "Everything works—no plugins needed",
                  "Start studying in under a minute",
                  "Free on all platforms",
                ].map((benefit, i) => (
                  <li key={i} className="flex items-start gap-2 sm:gap-3">
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300 text-xs sm:text-sm">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-10 sm:mt-12 lg:mt-16"
        >
          <p className="text-slate-400 text-sm sm:text-base mb-2">
            Ready to study smarter?
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 text-cyan-400 font-medium hover:text-cyan-300 transition-colors group text-sm sm:text-base"
          >
            Get started for free
            <motion.span
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              →
            </motion.span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
