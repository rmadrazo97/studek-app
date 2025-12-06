"use client";

import { motion } from "framer-motion";
import {
  FocusRing,
  Heatmap,
  RetentionGraph,
  MagicDropzone,
} from "@/components/dashboard";

// Sample data - in production this would come from API/state
const sampleHeatmapData = Array.from({ length: 140 }, () =>
  Math.random() > 0.3 ? Math.floor(Math.random() * 60) : 0
);

const sampleRetentionHistory = Array.from({ length: 30 }, (_, i) =>
  85 + Math.sin(i / 5) * 8 + Math.random() * 3
);

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold font-display text-zinc-100">
          Good morning, Student
        </h1>
        <p className="text-zinc-500 mt-1">
          You have cards waiting for review. Keep up the great work!
        </p>
      </motion.div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        {/* Focus Ring - Large Hero Widget */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-5 lg:row-span-2 bg-[#0f0f11] border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors"
        >
          <FocusRing dueCards={42} newCards={15} reviewCards={27} />
        </motion.div>

        {/* Heatmap Widget */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-7 bg-[#0f0f11] border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors"
        >
          <Heatmap
            data={sampleHeatmapData}
            currentStreak={12}
            longestStreak={45}
          />
        </motion.div>

        {/* Retention Graph Widget */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="lg:col-span-4 bg-[#0f0f11] border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors"
        >
          <RetentionGraph
            trueRetention={94}
            targetRetention={90}
            stabilityAvg={28}
            difficultyAvg={5.2}
            historyData={sampleRetentionHistory}
          />
        </motion.div>

        {/* Magic Dropzone Widget */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="lg:col-span-3 bg-[#0f0f11] border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors"
        >
          <MagicDropzone />
        </motion.div>

        {/* Quick Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="lg:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: "Total Cards", value: "1,247", change: "+23 this week" },
            { label: "Mature Cards", value: "892", change: "71% of total" },
            { label: "Study Time", value: "4.2h", change: "This week" },
            { label: "Cards Reviewed", value: "312", change: "Today" },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-[#0f0f11] border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors"
            >
              <span className="text-xs text-zinc-500 block mb-1">
                {stat.label}
              </span>
              <span className="text-2xl font-bold text-zinc-100 font-display">
                {stat.value}
              </span>
              <span className="text-xs text-zinc-600 block mt-1">
                {stat.change}
              </span>
            </div>
          ))}
        </motion.div>

        {/* Recent Decks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="lg:col-span-12 bg-[#0f0f11] border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-colors"
        >
          <h3 className="text-sm font-semibold text-zinc-100 mb-4">
            Recent Decks
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                name: "Medicine::Anatomy::Heart",
                due: 15,
                total: 120,
                color: "from-rose-500 to-orange-500",
              },
              {
                name: "Japanese::N3 Vocabulary",
                due: 8,
                total: 450,
                color: "from-violet-500 to-purple-500",
              },
              {
                name: "Computer Science::Algorithms",
                due: 19,
                total: 85,
                color: "from-cyan-500 to-blue-500",
              },
            ].map((deck, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-colors"
              >
                <div
                  className={`w-10 h-10 rounded-lg bg-gradient-to-br ${deck.color} flex items-center justify-center text-white font-bold text-sm`}
                >
                  {deck.due}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-100 truncate">
                    {deck.name}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {deck.due} due · {deck.total} total
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
