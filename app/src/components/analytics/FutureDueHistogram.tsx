"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { CalendarClock, AlertCircle } from "lucide-react";

interface WorkloadDay {
  date: string;
  newCards: number;
  reviews: number;
  total: number;
  backlog: number;
}

interface FutureDueHistogramProps {
  data: WorkloadDay[];
}

export function FutureDueHistogram({ data }: FutureDueHistogramProps) {
  const [viewDays, setViewDays] = useState(14); // 7, 14, or 30
  const [showBacklog, setShowBacklog] = useState(false);

  // Calculate max values for scaling
  const { visibleData, maxTotal, avgDaily, peakDay, warnings } = useMemo(() => {
    const visible = data.slice(0, viewDays);
    const maxT = Math.max(...visible.map((d) => showBacklog ? d.backlog : d.total), 1);
    const avg = visible.reduce((sum, d) => sum + d.total, 0) / visible.length;

    // Find peak day
    const peak = visible.reduce((max, d) => (d.total > max.total ? d : max), visible[0]);

    // Detect warnings
    const warns: string[] = [];
    const highDays = visible.filter((d) => d.total > avg * 1.5).length;
    if (highDays > viewDays / 3) {
      warns.push("Heavy workload ahead");
    }
    if (visible[0]?.total > avg * 2) {
      warns.push("Backlog building up");
    }

    return {
      visibleData: visible,
      maxTotal: maxT,
      avgDaily: avg,
      peakDay: peak,
      warnings: warns,
    };
  }, [data, viewDays, showBacklog]);

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dateStr === today.toISOString().split("T")[0]) return "Today";
    if (dateStr === tomorrow.toISOString().split("T")[0]) return "Tomorrow";

    return date.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
  };

  // SVG dimensions
  const height = 100;
  const barWidth = 100 / viewDays;
  const barGap = barWidth * 0.15;

  return (
    <div className="h-full flex flex-col p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-zinc-100">Future Workload</h3>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center bg-zinc-800 rounded-md p-0.5">
            {[7, 14, 30].map((days) => (
              <button
                key={days}
                onClick={() => setViewDays(days)}
                className={`px-2 py-0.5 text-xs rounded transition-colors ${
                  viewDays === days
                    ? "bg-zinc-700 text-zinc-100"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {days}d
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-3 px-2 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-lg"
        >
          <AlertCircle className="w-3.5 h-3.5 text-orange-400" />
          <span className="text-xs text-orange-400">{warnings[0]}</span>
        </motion.div>
      )}

      {/* Chart */}
      <div className="flex-1 relative min-h-[120px]">
        <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full h-full">
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="reviewGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
            <linearGradient id="newGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#15803d" />
            </linearGradient>
            <linearGradient id="backlogGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#dc2626" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Average line */}
          <line
            x1="0"
            y1={height - (avgDaily / maxTotal) * height}
            x2="100"
            y2={height - (avgDaily / maxTotal) * height}
            stroke="#a1a1aa"
            strokeWidth="0.5"
            strokeDasharray="2,2"
            opacity="0.5"
          />

          {/* Bars */}
          {visibleData.map((day, index) => {
            const x = index * barWidth + barGap / 2;
            const actualBarWidth = barWidth - barGap;

            // Calculate heights
            const reviewHeight = (day.reviews / maxTotal) * height;
            const newHeight = (day.newCards / maxTotal) * height;
            const backlogHeight = showBacklog ? (day.backlog / maxTotal) * height : 0;

            const reviewY = height - reviewHeight;
            const newY = reviewY - newHeight;
            const backlogY = height - backlogHeight;

            return (
              <g key={day.date}>
                {/* Backlog shadow (if enabled) */}
                {showBacklog && (
                  <motion.rect
                    initial={{ height: 0, y: height }}
                    animate={{ height: backlogHeight, y: backlogY }}
                    transition={{ delay: index * 0.02, duration: 0.3 }}
                    x={x}
                    width={actualBarWidth}
                    fill="url(#backlogGradient)"
                    rx="1"
                  />
                )}

                {/* Review cards (blue) */}
                <motion.rect
                  initial={{ height: 0, y: height }}
                  animate={{ height: reviewHeight, y: reviewY }}
                  transition={{ delay: index * 0.02, duration: 0.3 }}
                  x={x}
                  width={actualBarWidth}
                  fill="url(#reviewGradient)"
                  rx="1"
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                />

                {/* New cards (green) - stacked on top */}
                {day.newCards > 0 && (
                  <motion.rect
                    initial={{ height: 0, y: reviewY }}
                    animate={{ height: newHeight, y: newY }}
                    transition={{ delay: index * 0.02 + 0.1, duration: 0.3 }}
                    x={x}
                    width={actualBarWidth}
                    fill="url(#newGradient)"
                    rx="1"
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* X-axis labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1">
          <span className="text-[9px] text-zinc-500">{formatDate(visibleData[0]?.date)}</span>
          <span className="text-[9px] text-zinc-500">
            {formatDate(visibleData[Math.floor(viewDays / 2)]?.date)}
          </span>
          <span className="text-[9px] text-zinc-500">
            {formatDate(visibleData[viewDays - 1]?.date)}
          </span>
        </div>

        {/* Average label */}
        <div
          className="absolute right-0 text-[9px] text-zinc-500 bg-zinc-900/80 px-1 rounded"
          style={{ top: `${100 - (avgDaily / maxTotal) * 100}%`, transform: "translateY(-50%)" }}
        >
          avg
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3 mb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-gradient-to-b from-blue-500 to-blue-700" />
          <span className="text-[10px] text-zinc-400">Reviews</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-gradient-to-b from-green-500 to-green-700" />
          <span className="text-[10px] text-zinc-400">New</span>
        </div>
        <button
          onClick={() => setShowBacklog(!showBacklog)}
          className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded transition-colors ${
            showBacklog ? "bg-zinc-700" : "hover:bg-zinc-800"
          }`}
        >
          <div className="w-2.5 h-2.5 rounded-sm bg-red-500/30" />
          <span className="text-[10px] text-zinc-400">Backlog</span>
        </button>
      </div>

      {/* Stats Footer */}
      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-zinc-800">
        <div>
          <span className="text-[10px] text-zinc-500 block">Today</span>
          <span className="text-sm font-medium text-zinc-100">
            {visibleData[0]?.total || 0}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-zinc-500 block">Avg/Day</span>
          <span className="text-sm font-medium text-zinc-100">
            {Math.round(avgDaily)}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-zinc-500 block">Peak</span>
          <span className="text-sm font-medium text-orange-400">
            {peakDay?.total || 0}
          </span>
        </div>
      </div>
    </div>
  );
}

export default FutureDueHistogram;
