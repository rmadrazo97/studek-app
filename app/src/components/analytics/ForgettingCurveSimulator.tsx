"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Brain, Sliders, Info, AlertTriangle, CheckCircle } from "lucide-react";
import { generateForgettingCurve, calculateInterval } from "@/lib/fsrs";

interface ForgettingCurveSimulatorProps {
  initialStability?: number;
  initialRetention?: number;
  avgStability?: number;
}

export function ForgettingCurveSimulator({
  initialStability = 30,
  initialRetention = 0.9,
  avgStability = 28,
}: ForgettingCurveSimulatorProps) {
  const [desiredRetention, setDesiredRetention] = useState(initialRetention);
  const [stability, setStability] = useState(initialStability);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Generate curve data
  const { curveData, interval, workloadImpact } = useMemo(() => {
    const days = Math.max(stability * 2, 60);
    const data = generateForgettingCurve(stability, days, 100);

    // Calculate optimal interval for this retention target
    const optimalInterval = calculateInterval(stability, desiredRetention);

    // Estimate workload impact (relative to 90% baseline)
    const baselineInterval = calculateInterval(stability, 0.9);
    const workloadChange = ((baselineInterval / optimalInterval) - 1) * 100;

    // Define retention zones for coloring
    const zones = {
      high: { min: 90, color: "emerald" },
      good: { min: 80, color: "cyan" },
      warning: { min: 70, color: "yellow" },
      danger: { min: 0, color: "red" },
    };

    return {
      curveData: data,
      interval: optimalInterval,
      workloadImpact: workloadChange,
      retentionZones: zones,
    };
  }, [stability, desiredRetention]);

  // SVG dimensions
  const width = 100;
  const height = 100;
  const padding = { top: 5, right: 5, bottom: 5, left: 5 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Create SVG path
  const linePath = useMemo(() => {
    const xScale = (day: number) =>
      padding.left + (day / curveData[curveData.length - 1].day) * chartWidth;
    const yScale = (retention: number) =>
      padding.top + ((100 - retention) / 100) * chartHeight;

    const points = curveData.map((d) => `${xScale(d.day)},${yScale(d.retention)}`);
    return `M ${points.join(" L ")}`;
  }, [curveData, chartWidth, chartHeight]);

  // Area path (filled region under curve)
  const areaPath = useMemo(() => {
    const xScale = (day: number) =>
      padding.left + (day / curveData[curveData.length - 1].day) * chartWidth;
    const yScale = (retention: number) =>
      padding.top + ((100 - retention) / 100) * chartHeight;

    const points = curveData.map((d) => `L ${xScale(d.day)},${yScale(d.retention)}`);
    return `M ${xScale(0)},${height - padding.bottom} ${points.join(" ")} L ${xScale(curveData[curveData.length - 1].day)},${height - padding.bottom} Z`;
  }, [curveData, chartWidth, chartHeight, height]);

  // Retention threshold line position
  const thresholdY = padding.top + ((100 - desiredRetention * 100) / 100) * chartHeight;

  // Find intersection point (where curve hits threshold)
  const intersectionX = useMemo(() => {
    const targetRetention = desiredRetention * 100;
    const intersection = curveData.find((d) => d.retention <= targetRetention);
    if (!intersection) return chartWidth + padding.left;

    const xScale = (day: number) =>
      padding.left + (day / curveData[curveData.length - 1].day) * chartWidth;
    return xScale(intersection.day);
  }, [curveData, desiredRetention, chartWidth]);

  const getRetentionStatus = () => {
    if (desiredRetention >= 0.95) return { icon: AlertTriangle, text: "Very High - More reviews needed", color: "text-yellow-400" };
    if (desiredRetention >= 0.9) return { icon: CheckCircle, text: "Optimal - Balanced", color: "text-emerald-400" };
    if (desiredRetention >= 0.85) return { icon: CheckCircle, text: "Good - Efficient", color: "text-cyan-400" };
    return { icon: AlertTriangle, text: "Low - Risk of forgetting", color: "text-orange-400" };
  };

  const status = getRetentionStatus();
  const StatusIcon = status.icon;

  return (
    <div className="h-full flex flex-col p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-zinc-100">Forgetting Curve</h3>
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <Sliders className="w-3 h-3" />
          {showAdvanced ? "Hide" : "Show"} Controls
        </button>
      </div>

      {/* Main Visualization */}
      <div className="flex-1 relative min-h-[140px]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((y) => (
            <line
              key={y}
              x1={padding.left}
              y1={padding.top + (y / 100) * chartHeight}
              x2={width - padding.right}
              y2={padding.top + (y / 100) * chartHeight}
              stroke="#27272a"
              strokeWidth="0.3"
            />
          ))}

          {/* Area fill */}
          <motion.path
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            d={areaPath}
            fill="url(#curveGradient)"
          />

          {/* Target retention threshold line */}
          <motion.line
            x1={padding.left}
            y1={thresholdY}
            x2={width - padding.right}
            y2={thresholdY}
            stroke="#22d3ee"
            strokeWidth="0.8"
            strokeDasharray="2,2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
          />

          {/* Intersection marker */}
          <motion.circle
            cx={intersectionX}
            cy={thresholdY}
            r="2"
            fill="#22d3ee"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 }}
          />

          {/* Main curve */}
          <motion.path
            d={linePath}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          />

          {/* Start point */}
          <circle cx={padding.left} cy={padding.top} r="2" fill="#a78bfa" />
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[9px] text-zinc-500 -translate-x-1">
          <span>100%</span>
          <span>50%</span>
          <span>0%</span>
        </div>

        {/* Interval marker */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-zinc-800/90 border border-zinc-700 rounded px-2 py-1"
        >
          <span className="text-[10px] text-cyan-400 font-medium">
            Review at {interval}d
          </span>
        </motion.div>
      </div>

      {/* Controls */}
      {showAdvanced && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="mt-4 pt-4 border-t border-zinc-800 space-y-3"
        >
          {/* Desired Retention Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-zinc-400">Target Retention</label>
              <span className="text-xs font-medium text-cyan-400">
                {Math.round(desiredRetention * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.8"
              max="0.97"
              step="0.01"
              value={desiredRetention}
              onChange={(e) => setDesiredRetention(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Stability Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-zinc-400">Memory Stability</label>
              <span className="text-xs font-medium text-violet-400">
                {stability}d
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="365"
              step="1"
              value={stability}
              onChange={(e) => setStability(parseInt(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
            />
          </div>
        </motion.div>
      )}

      {/* Stats Footer */}
      <div className="mt-4 pt-3 border-t border-zinc-800">
        {/* Status Indicator */}
        <div className="flex items-center gap-2 mb-3">
          <StatusIcon className={`w-3.5 h-3.5 ${status.color}`} />
          <span className={`text-xs ${status.color}`}>{status.text}</span>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <span className="text-[10px] text-zinc-500 block">Interval</span>
            <span className="text-sm font-medium text-zinc-100">{interval}d</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 block">Workload</span>
            <span className={`text-sm font-medium ${workloadImpact > 0 ? "text-orange-400" : "text-emerald-400"}`}>
              {workloadImpact > 0 ? "+" : ""}{Math.round(workloadImpact)}%
            </span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 block">Avg Stability</span>
            <span className="text-sm font-medium text-zinc-100">{avgStability}d</span>
          </div>
        </div>
      </div>

      {/* Info Tooltip */}
      <div className="mt-3 flex items-start gap-2 text-[10px] text-zinc-500 bg-zinc-900/50 rounded-lg p-2">
        <Info className="w-3 h-3 mt-0.5 shrink-0" />
        <p>
          The curve shows how memory decays over time. Higher retention = more reviews.
          FSRS uses a power law model for accurate predictions.
        </p>
      </div>
    </div>
  );
}

export default ForgettingCurveSimulator;
