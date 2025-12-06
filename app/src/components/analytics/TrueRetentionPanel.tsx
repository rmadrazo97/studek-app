"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Target,
  Gauge,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Info,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface RetentionMetrics {
  trueRetention: number; // Actual observed retention %
  desiredRetention: number; // Target retention %
  avgRetrievability: number; // Current average R %
  avgStability: number; // Days
  avgDifficulty: number; // 1-10
  trend: number; // % change from previous period
  historyData: number[]; // Last 30 days
}

interface TrueRetentionPanelProps {
  metrics: RetentionMetrics;
  compact?: boolean;
}

export function TrueRetentionPanel({ metrics, compact = false }: TrueRetentionPanelProps) {
  const {
    trueRetention,
    desiredRetention,
    avgRetrievability,
    avgStability,
    avgDifficulty,
    trend,
    historyData,
  } = metrics;

  // Calculate status
  const status = useMemo(() => {
    const diff = trueRetention - desiredRetention;
    if (diff > 5) {
      return {
        type: "over" as const,
        icon: AlertTriangle,
        color: "text-yellow-400",
        bgColor: "bg-yellow-500/10",
        borderColor: "border-yellow-500/20",
        message: "Over-studying - Consider reducing desired retention",
      };
    }
    if (diff < -10) {
      return {
        type: "under" as const,
        icon: AlertTriangle,
        color: "text-red-400",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/20",
        message: "Below target - Review struggling cards or adjust settings",
      };
    }
    return {
      type: "optimal" as const,
      icon: CheckCircle,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
      message: "On track - Retention matches target",
    };
  }, [trueRetention, desiredRetention]);

  // SVG path for mini sparkline
  const sparklinePath = useMemo(() => {
    if (historyData.length < 2) return "";
    const min = Math.min(...historyData);
    const max = Math.max(...historyData);
    const range = max - min || 1;

    const width = 100;
    const height = 30;
    const padding = 2;

    const points = historyData.map((value, i) => {
      const x = padding + (i / (historyData.length - 1)) * (width - padding * 2);
      const y = padding + (1 - (value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    });

    return `M ${points.join(" L ")}`;
  }, [historyData]);

  // Area path for sparkline fill
  const areaPath = useMemo(() => {
    if (historyData.length < 2) return "";
    const min = Math.min(...historyData);
    const max = Math.max(...historyData);
    const range = max - min || 1;

    const width = 100;
    const height = 30;
    const padding = 2;

    const points = historyData.map((value, i) => {
      const x = padding + (i / (historyData.length - 1)) * (width - padding * 2);
      const y = padding + (1 - (value - min) / range) * (height - padding * 2);
      return `L ${x},${y}`;
    });

    return `M ${padding},${height} ${points.join(" ")} L ${width - padding},${height} Z`;
  }, [historyData]);

  const StatusIcon = status.icon;

  // Get color class based on retention value
  const getRetentionColorClass = (value: number) => {
    if (value >= 95) return "text-emerald-400";
    if (value >= 90) return "text-cyan-400";
    if (value >= 85) return "text-blue-400";
    if (value >= 80) return "text-yellow-400";
    return "text-red-400";
  };

  // Get difficulty label
  const getDifficultyLabel = (d: number) => {
    if (d <= 3) return { label: "Easy", color: "text-emerald-400" };
    if (d <= 5) return { label: "Normal", color: "text-cyan-400" };
    if (d <= 7) return { label: "Hard", color: "text-yellow-400" };
    return { label: "Very Hard", color: "text-red-400" };
  };

  const diffLabel = getDifficultyLabel(avgDifficulty);

  if (compact) {
    // Compact version for smaller widget
    return (
      <div className="h-full flex flex-col p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-semibold text-zinc-100">FSRS Stats</h3>
          </div>
          <div className={`flex items-center gap-1 text-xs ${trend >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{trend >= 0 ? "+" : ""}{trend.toFixed(1)}%</span>
          </div>
        </div>

        {/* Main Retention Display */}
        <div className="flex items-baseline gap-2 mb-3">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-4xl font-bold font-display ${getRetentionColorClass(trueRetention)}`}
          >
            {trueRetention.toFixed(1)}%
          </motion.span>
          <span className="text-xs text-zinc-500">True Retention</span>
        </div>

        {/* Mini Sparkline */}
        <div className="h-8 mb-3">
          <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full">
            <defs>
              <linearGradient id="sparkGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#sparkGradient)" />
            <path d={sparklinePath} fill="none" stroke="#a78bfa" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-zinc-900/50 rounded-lg p-2">
            <span className="text-[10px] text-zinc-500 block">Target</span>
            <span className="text-sm font-medium text-cyan-400">{desiredRetention}%</span>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-2">
            <span className="text-[10px] text-zinc-500 block">Stability</span>
            <span className="text-sm font-medium text-zinc-100">{avgStability.toFixed(0)}d</span>
          </div>
        </div>
      </div>
    );
  }

  // Full version
  return (
    <div className="h-full flex flex-col p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-zinc-100">FSRS Analytics</h3>
        </div>
        <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">v5</span>
      </div>

      {/* Main Retention Display */}
      <div className="flex items-center gap-6 mb-4">
        <div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`text-5xl font-bold font-display ${getRetentionColorClass(trueRetention)}`}
          >
            {trueRetention.toFixed(1)}%
          </motion.div>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-zinc-500">True Retention</span>
            <div className={`flex items-center gap-0.5 text-xs ${trend >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {trend >= 0 ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              <span>{Math.abs(trend).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Gauge visual */}
        <div className="flex-1">
          <svg viewBox="0 0 100 50" className="w-full h-16">
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="50%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
            {/* Background arc */}
            <path
              d="M 10 45 A 40 40 0 0 1 90 45"
              fill="none"
              stroke="#27272a"
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* Filled arc */}
            <motion.path
              d="M 10 45 A 40 40 0 0 1 90 45"
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray="126"
              initial={{ strokeDashoffset: 126 }}
              animate={{ strokeDashoffset: 126 - (trueRetention / 100) * 126 }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
            {/* Needle */}
            <motion.line
              x1="50"
              y1="45"
              x2="50"
              y2="15"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ rotate: -90, originX: "50px", originY: "45px" }}
              animate={{
                rotate: -90 + (trueRetention / 100) * 180,
                originX: "50px",
                originY: "45px",
              }}
              transition={{ duration: 1, ease: "easeOut" }}
              style={{ transformOrigin: "50px 45px" }}
            />
            <circle cx="50" cy="45" r="4" fill="#fff" />
          </svg>
        </div>
      </div>

      {/* Status Banner */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center gap-2 mb-4 p-2.5 rounded-lg ${status.bgColor} border ${status.borderColor}`}
      >
        <StatusIcon className={`w-4 h-4 ${status.color}`} />
        <span className={`text-xs ${status.color}`}>{status.message}</span>
      </motion.div>

      {/* 30-Day Graph */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-zinc-500">30-Day History</span>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-zinc-600">
              {Math.min(...historyData).toFixed(0)}% - {Math.max(...historyData).toFixed(0)}%
            </span>
          </div>
        </div>
        <div className="h-16 bg-zinc-900/50 rounded-lg p-2">
          <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full">
            <defs>
              <linearGradient id="historyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Target line */}
            <line
              x1="0"
              y1={30 - ((desiredRetention - Math.min(...historyData)) / (Math.max(...historyData) - Math.min(...historyData) || 1)) * 26 - 2}
              x2="100"
              y2={30 - ((desiredRetention - Math.min(...historyData)) / (Math.max(...historyData) - Math.min(...historyData) || 1)) * 26 - 2}
              stroke="#22d3ee"
              strokeWidth="0.5"
              strokeDasharray="2,2"
              opacity="0.5"
            />
            <path d={areaPath} fill="url(#historyGradient)" />
            <motion.path
              d={sparklinePath}
              fill="none"
              stroke="#a78bfa"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1 }}
            />
          </svg>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-900/50 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Target className="w-3 h-3 text-cyan-400" />
            <span className="text-[10px] text-zinc-500">Desired Retention</span>
          </div>
          <span className="text-lg font-bold text-cyan-400">{desiredRetention}%</span>
        </div>

        <div className="bg-zinc-900/50 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Gauge className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] text-zinc-500">Avg Retrievability</span>
          </div>
          <span className="text-lg font-bold text-emerald-400">{avgRetrievability.toFixed(1)}%</span>
        </div>

        <div className="bg-zinc-900/50 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <BarChart3 className="w-3 h-3 text-violet-400" />
            <span className="text-[10px] text-zinc-500">Avg Stability</span>
          </div>
          <span className="text-lg font-bold text-violet-400">{avgStability.toFixed(0)}d</span>
        </div>

        <div className="bg-zinc-900/50 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Brain className="w-3 h-3 text-orange-400" />
            <span className="text-[10px] text-zinc-500">Avg Difficulty</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-zinc-100">{avgDifficulty.toFixed(1)}</span>
            <span className={`text-xs ${diffLabel.color}`}>{diffLabel.label}</span>
          </div>
        </div>
      </div>

      {/* Info Footer */}
      <div className="mt-4 pt-3 border-t border-zinc-800">
        <div className="flex items-start gap-2 text-[10px] text-zinc-500">
          <Info className="w-3 h-3 mt-0.5 shrink-0" />
          <p>
            True retention measures your actual recall rate on mature cards.
            Average retrievability shows your current knowledge level (typically 94-96% with 90% target).
          </p>
        </div>
      </div>
    </div>
  );
}

export default TrueRetentionPanel;
