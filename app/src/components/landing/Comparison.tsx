"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Check, X, Sparkles, Crown } from "lucide-react";

interface ComparisonRow {
  feature: string;
  studek: string | boolean;
  anki: string | boolean;
  quizlet: string | boolean;
}

const comparisonData: ComparisonRow[] = [
  {
    feature: "Spaced Repetition",
    studek: "FSRS (Advanced)",
    anki: "FSRS/SM-2",
    quizlet: "Basic",
  },
  {
    feature: "AI Card Generation",
    studek: "Native (Unlimited)",
    anki: "Plugin Required",
    quizlet: "Paid Tier",
  },
  {
    feature: "Setup Time",
    studek: "Instant",
    anki: "High (Plugins/CSS)",
    quizlet: "Low",
  },
  {
    feature: "Mobile App",
    studek: "Free / Unified",
    anki: "$25 iOS / Free Android",
    quizlet: "Free (Ad-heavy)",
  },
  {
    feature: "Offline Mode",
    studek: true,
    anki: true,
    quizlet: false,
  },
  {
    feature: "Image Occlusion",
    studek: "AI-Powered",
    anki: "Plugin Required",
    quizlet: false,
  },
  {
    feature: "Voice Study Mode",
    studek: true,
    anki: false,
    quizlet: false,
  },
  {
    feature: "Real-time Collaboration",
    studek: true,
    anki: "Export/Import",
    quizlet: true,
  },
  {
    feature: "Modern UI",
    studek: true,
    anki: false,
    quizlet: true,
  },
  {
    feature: "Anki Import",
    studek: true,
    anki: true,
    quizlet: false,
  },
];

function CellValue({ value, highlight = false }: { value: string | boolean; highlight?: boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className={`w-5 h-5 ${highlight ? "text-cyan-400" : "text-green-400"}`} />
    ) : (
      <X className="w-5 h-5 text-slate-600" />
    );
  }

  const isNegative = value.toLowerCase().includes("required") || value.toLowerCase().includes("high") || value.includes("$25");
  const isNeutral = value.toLowerCase().includes("basic") || value.toLowerCase().includes("export");

  return (
    <span
      className={`text-sm ${
        highlight
          ? "text-cyan-400 font-medium"
          : isNegative
          ? "text-red-400/80"
          : isNeutral
          ? "text-yellow-400/80"
          : "text-slate-300"
      }`}
    >
      {value}
    </span>
  );
}

export function Comparison() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="compare" ref={ref} className="relative py-32">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0a0b0d]">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-cyan-400 text-sm font-medium tracking-wider uppercase">
            Compare
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-slate-100 mt-4">
            See how Studek stacks up
          </h2>
          <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
            An honest comparison with the tools you already know.
          </p>
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="rounded-2xl border border-[rgba(148,163,184,0.08)] bg-[#0f1115] overflow-hidden"
        >
          {/* Table Header */}
          <div className="grid grid-cols-4 gap-4 p-4 bg-[#0a0b0d] border-b border-[rgba(148,163,184,0.08)]">
            <div className="text-sm font-medium text-slate-500">Feature</div>
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border border-cyan-500/20">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="font-display font-semibold text-slate-100">Studek</span>
                <Crown className="w-4 h-4 text-yellow-400" />
              </div>
            </div>
            <div className="text-center">
              <span className="text-slate-400 font-medium">Anki</span>
            </div>
            <div className="text-center">
              <span className="text-slate-400 font-medium">Quizlet</span>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-[rgba(148,163,184,0.05)]">
            {comparisonData.map((row, index) => (
              <motion.div
                key={row.feature}
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
                className="grid grid-cols-4 gap-4 p-4 hover:bg-[#161a1f]/50 transition-colors"
              >
                <div className="text-sm text-slate-300 flex items-center">
                  {row.feature}
                </div>
                <div className="flex justify-center items-center">
                  <CellValue value={row.studek} highlight />
                </div>
                <div className="flex justify-center items-center">
                  <CellValue value={row.anki} />
                </div>
                <div className="flex justify-center items-center">
                  <CellValue value={row.quizlet} />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-slate-500">
            Already using Anki?{" "}
            <a href="#" className="text-cyan-400 hover:text-cyan-300 transition-colors">
              Import your .apkg files in seconds →
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
