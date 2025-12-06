"use client";

import { motion } from "framer-motion";
import { TrendingUp, Brain } from "lucide-react";

interface RetentionGraphProps {
  trueRetention: number;
  targetRetention: number;
  stabilityAvg: number;
  difficultyAvg: number;
  historyData: number[]; // Last 30 days retention %
}

export function RetentionGraph({
  trueRetention,
  targetRetention,
  stabilityAvg,
  difficultyAvg,
  historyData,
}: RetentionGraphProps) {
  // Calculate graph points
  const maxValue = 100;
  const minValue = Math.min(...historyData, 70);
  const range = maxValue - minValue;

  const points = historyData
    .map((value, index) => {
      const x = (index / (historyData.length - 1)) * 100;
      const y = 100 - ((value - minValue) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  // Create area path
  const areaPath = `M 0,100 L 0,${100 - ((historyData[0] - minValue) / range) * 100} ${historyData
    .map((value, index) => {
      const x = (index / (historyData.length - 1)) * 100;
      const y = 100 - ((value - minValue) / range) * 100;
      return `L ${x},${y}`;
    })
    .join(" ")} L 100,100 Z`;

  const getRetentionColor = (retention: number) => {
    if (retention >= 90) return "text-emerald-400";
    if (retention >= 80) return "text-cyan-400";
    if (retention >= 70) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="h-full flex flex-col p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-zinc-100">FSRS Analytics</h3>
        </div>
        <div className="flex items-center gap-1 text-xs text-emerald-400">
          <TrendingUp className="w-3 h-3" />
          <span>+2.3%</span>
        </div>
      </div>

      {/* Main Retention Display */}
      <div className="flex items-baseline gap-2 mb-4">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-4xl font-bold font-display ${getRetentionColor(trueRetention)}`}
        >
          {trueRetention}%
        </motion.span>
        <span className="text-sm text-zinc-500">True Retention</span>
      </div>

      {/* Graph */}
      <div className="flex-1 relative mb-4">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="100"
              y2={y}
              stroke="#27272a"
              strokeWidth="0.5"
            />
          ))}

          {/* Target retention line */}
          <line
            x1="0"
            y1={100 - ((targetRetention - minValue) / range) * 100}
            x2="100"
            y2={100 - ((targetRetention - minValue) / range) * 100}
            stroke="#22d3ee"
            strokeWidth="0.5"
            strokeDasharray="2,2"
            opacity="0.5"
          />

          {/* Gradient area */}
          <defs>
            <linearGradient id="retentionGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
            </linearGradient>
          </defs>

          <motion.path
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            d={areaPath}
            fill="url(#retentionGradient)"
          />

          {/* Line */}
          <motion.polyline
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            points={points}
            fill="none"
            stroke="#a78bfa"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-zinc-500 -translate-x-6">
          <span>{maxValue}%</span>
          <span>{minValue}%</span>
        </div>
      </div>

      {/* FSRS Stats */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-800">
        <div>
          <span className="text-xs text-zinc-500 block">Avg Stability</span>
          <span className="text-sm font-medium text-zinc-100">{stabilityAvg} days</span>
        </div>
        <div>
          <span className="text-xs text-zinc-500 block">Avg Difficulty</span>
          <span className="text-sm font-medium text-zinc-100">{difficultyAvg.toFixed(1)}</span>
        </div>
        <div>
          <span className="text-xs text-zinc-500 block">Target Retention</span>
          <span className="text-sm font-medium text-cyan-400">{targetRetention}%</span>
        </div>
        <div>
          <span className="text-xs text-zinc-500 block">Algorithm</span>
          <span className="text-sm font-medium text-violet-400">FSRS v4</span>
        </div>
      </div>
    </div>
  );
}
