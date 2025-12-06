"use client";

import { motion } from "framer-motion";
import { Flame } from "lucide-react";

interface HeatmapProps {
  data: number[]; // Array of 365 values representing review counts
  currentStreak: number;
  longestStreak: number;
}

export function Heatmap({ data, currentStreak, longestStreak }: HeatmapProps) {
  // Generate weeks and days for the heatmap grid
  const weeks = 20; // Show ~20 weeks
  const daysPerWeek = 7;

  // Get color intensity based on review count
  const getColor = (count: number) => {
    if (count === 0) return "bg-zinc-800/50";
    if (count < 10) return "bg-emerald-900/60";
    if (count < 25) return "bg-emerald-700/70";
    if (count < 50) return "bg-emerald-500/80";
    return "bg-emerald-400";
  };

  const getTooltip = (count: number, dayIndex: number) => {
    const date = new Date();
    date.setDate(date.getDate() - (weeks * daysPerWeek - dayIndex - 1));
    const dateStr = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    return `${count} reviews on ${dateStr}`;
  };

  // Days of week labels
  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];

  return (
    <div className="h-full flex flex-col p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-zinc-100">Study Activity</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-sm text-zinc-400">
              <span className="text-zinc-100 font-medium">{currentStreak}</span> day streak
            </span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="flex-1 flex items-center">
        <div className="flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-[3px] mr-2">
            {dayLabels.map((label, i) => (
              <span key={i} className="h-[13px] text-[10px] text-zinc-500 leading-[13px]">
                {label}
              </span>
            ))}
          </div>

          {/* Grid */}
          <div className="flex gap-[3px]">
            {Array.from({ length: weeks }).map((_, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-[3px]">
                {Array.from({ length: daysPerWeek }).map((_, dayIndex) => {
                  const dataIndex = weekIndex * daysPerWeek + dayIndex;
                  const count = data[dataIndex] || 0;
                  return (
                    <motion.div
                      key={dayIndex}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        delay: (weekIndex * daysPerWeek + dayIndex) * 0.002,
                        duration: 0.2,
                      }}
                      className={`
                        w-[13px] h-[13px] rounded-sm cursor-pointer
                        ${getColor(count)}
                        hover:ring-1 hover:ring-zinc-500
                        transition-all
                      `}
                      title={getTooltip(count, dataIndex)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend & Stats */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-zinc-500">Less</span>
          <div className="flex gap-[2px]">
            {["bg-zinc-800/50", "bg-emerald-900/60", "bg-emerald-700/70", "bg-emerald-500/80", "bg-emerald-400"].map(
              (color, i) => (
                <div key={i} className={`w-[10px] h-[10px] rounded-sm ${color}`} />
              )
            )}
          </div>
          <span className="text-xs text-zinc-500">More</span>
        </div>
        <div className="text-xs text-zinc-500">
          Longest: <span className="text-zinc-300">{longestStreak} days</span>
        </div>
      </div>
    </div>
  );
}
