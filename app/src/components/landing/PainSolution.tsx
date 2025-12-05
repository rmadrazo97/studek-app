"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { X, Check, AlertTriangle, Sparkles, FileText, Youtube, Globe } from "lucide-react";

export function PainSolution() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0a0b0d]">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="text-cyan-400 text-sm font-medium tracking-wider uppercase">
            The Problem
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-slate-100 mt-4">
            Learning tools shouldn&apos;t fight you
          </h2>
          <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
            You want to study. Not configure plugins, edit CSS, or manually type hundreds of cards.
          </p>
        </motion.div>

        {/* Comparison Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* The Old Way */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="h-full rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <X className="w-5 h-5 text-red-400" />
                </div>
                <span className="text-lg font-semibold text-slate-300">The Old Way</span>
              </div>

              {/* Mock Anki UI */}
              <div className="rounded-xl bg-[#2d2d2d] border border-slate-700/50 overflow-hidden mb-6">
                {/* Title bar */}
                <div className="bg-[#3d3d3d] px-3 py-2 border-b border-slate-700/50">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>Anki - Browse (1 of 2847 cards selected)</span>
                  </div>
                </div>
                {/* Menu bar */}
                <div className="bg-[#353535] px-2 py-1 border-b border-slate-700/50 flex gap-4 text-xs text-slate-500">
                  <span>File</span>
                  <span>Edit</span>
                  <span>View</span>
                  <span>Cards</span>
                  <span>Notes</span>
                  <span>Tools</span>
                </div>
                {/* Content */}
                <div className="p-4 space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    <span className="px-2 py-1 bg-[#4a4a4a] rounded text-[10px] text-slate-400">deck:&quot;Medical&quot;</span>
                    <span className="px-2 py-1 bg-[#4a4a4a] rounded text-[10px] text-slate-400">tag:biochem</span>
                    <span className="px-2 py-1 bg-[#4a4a4a] rounded text-[10px] text-slate-400">is:new</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    SELECT * FROM notes WHERE deck_id = 1532 AND...
                  </div>
                </div>
              </div>

              {/* Pain Points */}
              <ul className="space-y-4">
                {[
                  "Manual card creation takes hours",
                  "CSS hacks for readable formatting",
                  "Plugin conflicts break your workflow",
                  "Steep learning curve intimidates beginners",
                  "Mobile app costs $25 on iOS",
                ].map((pain, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-400 text-sm">{pain}</span>
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
            <div className="h-full rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-violet-500/5 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                </div>
                <span className="text-lg font-semibold text-slate-300">The Studek Way</span>
              </div>

              {/* Magic Import Demo */}
              <div className="rounded-xl bg-[#0f1115] border border-[rgba(148,163,184,0.08)] overflow-hidden mb-6">
                {/* Drop Zone */}
                <div className="p-6 border-b border-[rgba(148,163,184,0.08)]">
                  <div className="border-2 border-dashed border-cyan-500/30 rounded-xl p-8 text-center hover:border-cyan-500/50 transition-colors cursor-pointer">
                    <div className="flex justify-center gap-4 mb-4">
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                      >
                        <FileText className="w-8 h-8 text-red-400" />
                      </motion.div>
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                      >
                        <Youtube className="w-8 h-8 text-red-500" />
                      </motion.div>
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                      >
                        <Globe className="w-8 h-8 text-blue-400" />
                      </motion.div>
                    </div>
                    <p className="text-slate-300 font-medium">Drop your files here</p>
                    <p className="text-slate-500 text-sm mt-1">PDF, YouTube URL, or any webpage</p>
                  </div>
                </div>

                {/* Processing indicator */}
                <div className="p-4 bg-[#161a1f]/50">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-sm text-slate-400">
                      AI generating <span className="text-cyan-400">24 cards</span> from your PDF...
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 bg-[#0f1115] rounded-full overflow-hidden">
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
              <ul className="space-y-4">
                {[
                  "AI generates cards in seconds",
                  "Beautiful formatting out of the box",
                  "Everything works—no plugins needed",
                  "Start studying in under a minute",
                  "Free on all platforms",
                ].map((benefit, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300 text-sm">{benefit}</span>
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
          className="text-center mt-16"
        >
          <p className="text-slate-400 mb-2">
            Ready to study smarter?
          </p>
          <a
            href="#"
            className="inline-flex items-center gap-2 text-cyan-400 font-medium hover:text-cyan-300 transition-colors group"
          >
            Get started for free
            <motion.span
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              →
            </motion.span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
