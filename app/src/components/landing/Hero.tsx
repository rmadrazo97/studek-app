"use client";

import { motion } from "framer-motion";
import { ArrowRight, Download, Play, Zap, Brain, Sparkles } from "lucide-react";
import { Button } from "../ui/Button";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[#08090a]">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-500/5 rounded-full blur-[80px]" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(148,163,184,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.5) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Column - Text Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0f1115] border border-cyan-500/20 mb-8"
            >
              <Zap className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-slate-300">Powered by FSRS Algorithm</span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-medium">
                v5
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight"
            >
              <span className="text-slate-100">The Power of </span>
              <span className="text-gradient">Anki</span>
              <span className="text-slate-100">.</span>
              <br />
              <span className="text-slate-100">The Simplicity of </span>
              <span className="text-gradient">AI</span>
              <span className="text-slate-100">.</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 text-lg md:text-xl text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              Turn PDFs, videos, and notes into intelligent flashcards in seconds.
              Master any subject with the world&apos;s most powerful spaced repetition—zero setup required.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Button
                variant="primary"
                size="lg"
                icon={<ArrowRight className="w-5 h-5" />}
                iconPosition="right"
                className="pulse-glow"
              >
                Start Learning Free
              </Button>
              <Button
                variant="secondary"
                size="lg"
                icon={<Download className="w-5 h-5" />}
              >
                Import from Anki
              </Button>
            </motion.div>

            {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-12 flex flex-col sm:flex-row items-center gap-6 justify-center lg:justify-start"
            >
              <div className="flex -space-x-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-[#08090a] flex items-center justify-center text-xs text-slate-400"
                    style={{ zIndex: 5 - i }}
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div className="text-sm text-slate-400">
                <span className="text-slate-100 font-semibold">2,500+</span> learners already studying smarter
              </div>
            </motion.div>
          </div>

          {/* Right Column - App Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            {/* Glow effect behind the mockup */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-violet-500/20 rounded-3xl blur-3xl scale-110" />

            {/* App Window Mockup */}
            <div className="relative glass rounded-2xl overflow-hidden shadow-2xl border border-[rgba(148,163,184,0.1)]">
              {/* Window Header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-[#0f1115]/80 border-b border-[rgba(148,163,184,0.08)]">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-lg bg-[#08090a]/50 text-xs text-slate-500">
                    studek.app
                  </div>
                </div>
              </div>

              {/* App Content - Flashcard Study View */}
              <div className="p-8 bg-gradient-to-br from-[#0f1115] to-[#08090a]">
                {/* Stats Bar */}
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm text-slate-400">Medical Biochemistry</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-green-400">12 due</span>
                    <span className="text-slate-500">|</span>
                    <span className="text-blue-400">24 new</span>
                  </div>
                </div>

                {/* Flashcard */}
                <motion.div
                  className="relative group cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-violet-500/10 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative bg-[#161a1f] rounded-xl p-8 border border-[rgba(148,163,184,0.08)] group-hover:border-cyan-500/20 transition-colors">
                    {/* Card Type Badge */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="px-2 py-1 rounded-md bg-violet-500/10 text-violet-400 text-xs">
                        Image Occlusion
                      </span>
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      <span className="text-xs text-slate-500">AI Generated</span>
                    </div>

                    {/* Card Content */}
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold text-slate-100">
                        What enzyme catalyzes the rate-limiting step of glycolysis?
                      </h3>

                      {/* Diagram placeholder */}
                      <div className="relative h-40 bg-[#0f1115] rounded-lg overflow-hidden border border-[rgba(148,163,184,0.05)]">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="grid grid-cols-3 gap-4 p-4 opacity-60">
                            {["Glucose", "G-6-P", "F-6-P", "F-1,6-BP", "...", "Pyruvate"].map((step, i) => (
                              <div key={i} className="px-3 py-2 rounded bg-[#161a1f] text-xs text-slate-400 text-center">
                                {step}
                              </div>
                            ))}
                          </div>
                        </div>
                        {/* Occlusion mask */}
                        <motion.div
                          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-8 bg-cyan-500 rounded flex items-center justify-center"
                          animate={{ opacity: [1, 0.7, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <span className="text-[#08090a] text-xs font-bold">?</span>
                        </motion.div>
                      </div>
                    </div>

                    {/* Answer hint */}
                    <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                      <Play className="w-4 h-4" />
                      <span>Tap to reveal answer</span>
                    </div>
                  </div>
                </motion.div>

                {/* Action Buttons */}
                <div className="flex justify-center gap-3 mt-6">
                  {[
                    { label: "Again", color: "bg-red-500/10 text-red-400 border-red-500/20" },
                    { label: "Hard", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
                    { label: "Good", color: "bg-green-500/10 text-green-400 border-green-500/20" },
                    { label: "Easy", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      className={`px-6 py-2 rounded-lg border ${btn.color} text-sm font-medium transition-all hover:scale-105`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <motion.div
              className="absolute -top-4 -right-4 px-3 py-2 glass rounded-lg shadow-lg"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-slate-300">Synced</span>
              </div>
            </motion.div>

            <motion.div
              className="absolute -bottom-4 -left-4 px-3 py-2 glass rounded-lg shadow-lg"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-slate-300">89% retention</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-6 h-10 rounded-full border-2 border-slate-700 flex items-start justify-center p-2"
        >
          <motion.div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
        </motion.div>
      </motion.div>
    </section>
  );
}
