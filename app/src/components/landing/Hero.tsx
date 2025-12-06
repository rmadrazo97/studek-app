"use client";

import { motion } from "framer-motion";
import { ArrowRight, Download, Zap, Brain, Sparkles, Shield, Clock, Star } from "lucide-react";
import { Button } from "../ui/Button";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 sm:pt-20">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[#08090a]">
        {/* Gradient orbs - smaller on mobile */}
        <div className="absolute top-1/4 -left-1/4 w-[300px] sm:w-[400px] lg:w-[600px] h-[300px] sm:h-[400px] lg:h-[600px] bg-cyan-500/10 rounded-full blur-[80px] sm:blur-[100px] lg:blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-1/4 w-[250px] sm:w-[350px] lg:w-[500px] h-[250px] sm:h-[350px] lg:h-[500px] bg-violet-500/10 rounded-full blur-[60px] sm:blur-[80px] lg:blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[600px] lg:w-[800px] h-[200px] sm:h-[300px] lg:h-[400px] bg-blue-500/5 rounded-full blur-[60px] sm:blur-[80px]" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02] sm:opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(148,163,184,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.5) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left Column - Text Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#0f1115] border border-cyan-500/20 mb-6 sm:mb-8"
            >
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
              <span className="text-xs sm:text-sm text-slate-300">Powered by FSRS Algorithm</span>
              <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] sm:text-xs font-medium">
                v5
              </span>
            </motion.div>

            {/* Headline - Better mobile sizing */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] tracking-tight"
            >
              <span className="text-slate-100">The Power of </span>
              <span className="text-gradient">Anki</span>
              <span className="text-slate-100">.</span>
              <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>
              <span className="text-slate-100">The Simplicity of </span>
              <span className="text-gradient">AI</span>
              <span className="text-slate-100">.</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              Turn PDFs, videos, and notes into intelligent flashcards in seconds.
              Master any subject with the world&apos;s most powerful spaced repetition—zero setup required.
            </motion.p>

            {/* Trust Signals - New for conversion */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="mt-4 sm:mt-6 flex flex-wrap items-center gap-3 sm:gap-4 justify-center lg:justify-start text-xs sm:text-sm text-slate-500"
            >
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-green-400" />
                No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                Setup in 30 seconds
              </span>
              <span className="flex items-center gap-1.5 hidden sm:flex">
                <Star className="w-3.5 h-3.5 text-yellow-400" />
                4.9/5 rating
              </span>
            </motion.div>

            {/* CTAs - Improved for conversion */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-6 sm:mt-8 lg:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start"
            >
              <Button
                variant="primary"
                size="lg"
                icon={<ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />}
                iconPosition="right"
                className="pulse-glow text-sm sm:text-base"
              >
                Start Learning Free
              </Button>
              <Button
                variant="secondary"
                size="lg"
                icon={<Download className="w-4 h-4 sm:w-5 sm:h-5" />}
                className="text-sm sm:text-base"
              >
                Import from Anki
              </Button>
            </motion.div>

            {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-8 sm:mt-10 lg:mt-12 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 justify-center lg:justify-start"
            >
              <div className="flex -space-x-2.5 sm:-space-x-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-[#08090a] flex items-center justify-center text-[10px] sm:text-xs text-slate-400"
                    style={{ zIndex: 5 - i }}
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div className="text-xs sm:text-sm text-slate-400">
                <span className="text-slate-100 font-semibold">2,500+</span> learners already studying smarter
              </div>
            </motion.div>
          </div>

          {/* Right Column - App Preview - Hidden on mobile, shown from md up */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative hidden md:block"
          >
            {/* Glow effect behind the mockup */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-violet-500/20 rounded-3xl blur-3xl scale-110" />

            {/* App Window Mockup */}
            <div className="relative glass rounded-2xl overflow-hidden shadow-2xl border border-[rgba(148,163,184,0.1)]">
              {/* Window Header */}
              <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-[#0f1115]/80 border-b border-[rgba(148,163,184,0.08)]">
                <div className="flex gap-1.5 sm:gap-2">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500/80" />
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-3 sm:px-4 py-1 rounded-lg bg-[#08090a]/50 text-[10px] sm:text-xs text-slate-500">
                    studek.app
                  </div>
                </div>
              </div>

              {/* App Content - Flashcard Study View */}
              <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-[#0f1115] to-[#08090a]">
                {/* Stats Bar */}
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
                      <span className="text-xs sm:text-sm text-slate-400">Medical Biochemistry</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
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
                  <div className="relative bg-[#161a1f] rounded-xl p-4 sm:p-6 lg:p-8 border border-[rgba(148,163,184,0.08)] group-hover:border-cyan-500/20 transition-colors">
                    {/* Card Type Badge */}
                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                      <span className="px-2 py-0.5 sm:py-1 rounded-md bg-violet-500/10 text-violet-400 text-[10px] sm:text-xs">
                        Image Occlusion
                      </span>
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      <span className="text-[10px] sm:text-xs text-slate-500">AI Generated</span>
                    </div>

                    {/* Card Content */}
                    <div className="space-y-3 sm:space-y-4">
                      <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-slate-100">
                        What enzyme catalyzes the rate-limiting step of glycolysis?
                      </h3>

                      {/* Diagram placeholder */}
                      <div className="relative h-28 sm:h-32 lg:h-40 bg-[#0f1115] rounded-lg overflow-hidden border border-[rgba(148,163,184,0.05)]">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="grid grid-cols-3 gap-2 sm:gap-4 p-2 sm:p-4 opacity-60">
                            {["Glucose", "G-6-P", "F-6-P", "F-1,6-BP", "...", "Pyruvate"].map((step, i) => (
                              <div key={i} className="px-2 sm:px-3 py-1 sm:py-2 rounded bg-[#161a1f] text-[10px] sm:text-xs text-slate-400 text-center">
                                {step}
                              </div>
                            ))}
                          </div>
                        </div>
                        {/* Occlusion mask */}
                        <motion.div
                          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 sm:w-20 h-6 sm:h-8 bg-cyan-500 rounded flex items-center justify-center"
                          animate={{ opacity: [1, 0.7, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <span className="text-[#08090a] text-[10px] sm:text-xs font-bold">?</span>
                        </motion.div>
                      </div>
                    </div>

                    {/* Answer hint */}
                    <div className="mt-3 sm:mt-4 flex items-center gap-2 text-xs sm:text-sm text-slate-500">
                      <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>Tap to reveal answer</span>
                    </div>
                  </div>
                </motion.div>

                {/* Action Buttons */}
                <div className="flex justify-center gap-2 sm:gap-3 mt-4 sm:mt-6">
                  {[
                    { label: "Again", color: "bg-red-500/10 text-red-400 border-red-500/20" },
                    { label: "Hard", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
                    { label: "Good", color: "bg-green-500/10 text-green-400 border-green-500/20" },
                    { label: "Easy", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      className={`px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 rounded-lg border ${btn.color} text-xs sm:text-sm font-medium transition-all hover:scale-105`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <motion.div
              className="absolute -top-3 sm:-top-4 -right-3 sm:-right-4 px-2.5 sm:px-3 py-1.5 sm:py-2 glass rounded-lg shadow-lg"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px] sm:text-xs text-slate-300">Synced</span>
              </div>
            </motion.div>

            <motion.div
              className="absolute -bottom-3 sm:-bottom-4 -left-3 sm:-left-4 px-2.5 sm:px-3 py-1.5 sm:py-2 glass rounded-lg shadow-lg"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400" />
                <span className="text-[10px] sm:text-xs text-slate-300">89% retention</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Mobile App Preview - Simplified version for mobile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-10 md:hidden"
        >
          <div className="relative max-w-sm mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-violet-500/20 rounded-2xl blur-2xl scale-105" />
            <div className="relative glass rounded-xl overflow-hidden shadow-xl border border-[rgba(148,163,184,0.1)]">
              <div className="p-4 bg-gradient-to-br from-[#0f1115] to-[#08090a]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs text-slate-400">Medical Biochemistry</span>
                  </div>
                  <span className="text-xs text-green-400">12 due</span>
                </div>
                <div className="bg-[#161a1f] rounded-lg p-4 border border-[rgba(148,163,184,0.08)]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 text-[10px]">
                      AI Generated
                    </span>
                  </div>
                  <p className="text-sm text-slate-100 font-medium">
                    What enzyme catalyzes the rate-limiting step of glycolysis?
                  </p>
                </div>
                <div className="flex justify-center gap-2 mt-3">
                  {["Again", "Hard", "Good", "Easy"].map((btn, i) => (
                    <span
                      key={btn}
                      className={`px-3 py-1 rounded text-[10px] font-medium ${
                        i === 2 ? "bg-green-500/10 text-green-400" : "bg-slate-500/10 text-slate-400"
                      }`}
                    >
                      {btn}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator - Hidden on very small screens */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 hidden sm:block"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-5 h-8 sm:w-6 sm:h-10 rounded-full border-2 border-slate-700 flex items-start justify-center p-1.5 sm:p-2"
        >
          <motion.div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-cyan-400" />
        </motion.div>
      </motion.div>
    </section>
  );
}
