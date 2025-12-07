"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Flame, Calendar, TrendingUp, Award, Snowflake } from "lucide-react";

interface HeatmapDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

interface ContributionHeatmapProps {
  data: HeatmapDay[];
  currentStreak: number;
  longestStreak: number;
  freezesAvailable?: number;
  freezesUsed?: number;
}

// Color scale following spec (Dark Mode - Green Theme)
const LEVEL_COLORS = {
  0: "#161b22", // Dark Gray - empty
  1: "#0e4429", // Dim Green
  2: "#006d32", // Mid Green
  3: "#26a641", // Bright Green
  4: "#39d353", // Neon Green - highest
};

// Month labels
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function ContributionHeatmap({
  data,
  currentStreak,
  longestStreak,
  freezesAvailable = 3,
  freezesUsed = 0,
}: ContributionHeatmapProps) {
  const [hoveredDay, setHoveredDay] = useState<HeatmapDay | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Process data into weeks
  const { weeks, monthLabels, totalReviews } = useMemo(() => {
    // Sort data by date
    const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Group into weeks (columns)
    const weeksArr: HeatmapDay[][] = [];
    let currentWeek: HeatmapDay[] = [];

    // Find the day of week for the first date to align properly
    const firstDate = new Date(sorted[0]?.date || new Date());
    const firstDayOfWeek = firstDate.getDay();

    // Add empty cells for alignment
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push({ date: "", count: 0, level: 0 });
    }

    sorted.forEach((day) => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeksArr.push(currentWeek);
        currentWeek = [];
      }
    });

    // Push remaining days
    if (currentWeek.length > 0) {
      weeksArr.push(currentWeek);
    }

    // Calculate month labels positions
    const labels: { month: string; weekIndex: number }[] = [];
    let lastMonth = -1;
    weeksArr.forEach((week, weekIndex) => {
      const firstValidDay = week.find((d) => d.date);
      if (firstValidDay) {
        const month = new Date(firstValidDay.date).getMonth();
        if (month !== lastMonth) {
          labels.push({ month: MONTHS[month], weekIndex });
          lastMonth = month;
        }
      }
    });

    // Calculate totals
    const total = sorted.reduce((sum, d) => sum + d.count, 0);
    return { weeks: weeksArr, monthLabels: labels, totalReviews: total };
  }, [data]);

  // Day labels
  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];

  const handleMouseEnter = (day: HeatmapDay, event: React.MouseEvent) => {
    if (!day.date) return;
    setHoveredDay(day);
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
  };

  const handleMouseLeave = () => {
    setHoveredDay(null);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="h-full flex flex-col p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-zinc-100">Contribution Graph</h3>
        </div>
        <div className="flex items-center gap-4">
          {/* Streak Counter */}
          <motion.div
            className="flex items-center gap-1.5"
            whileHover={{ scale: 1.05 }}
          >
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-sm text-zinc-400">
              <span className="text-zinc-100 font-medium">{currentStreak}</span> day streak
            </span>
          </motion.div>

          {/* Freeze Streaks */}
          <div className="flex items-center gap-1">
            {Array.from({ length: freezesAvailable + freezesUsed }).map((_, i) => (
              <Snowflake
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < freezesUsed ? "text-zinc-600" : "text-cyan-400"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Month Labels */}
      <div className="flex ml-8 mb-1">
        {monthLabels.map((label, i) => (
          <span
            key={i}
            className="text-[10px] text-zinc-500"
            style={{
              position: "relative",
              left: `${label.weekIndex * 13}px`,
              marginRight: i < monthLabels.length - 1
                ? `${(monthLabels[i + 1]?.weekIndex - label.weekIndex) * 13 - 24}px`
                : 0,
            }}
          >
            {label.month}
          </span>
        ))}
      </div>

      {/* Heatmap Grid */}
      <div className="flex-1 flex items-start overflow-x-auto pb-2">
        <div className="flex gap-[3px]">
          {/* Day labels */}
          <div className="flex flex-col gap-[3px] mr-1.5 shrink-0">
            {dayLabels.map((label, i) => (
              <span key={i} className="h-[11px] text-[10px] text-zinc-500 leading-[11px]">
                {label}
              </span>
            ))}
          </div>

          {/* Grid */}
          <div className="flex gap-[3px]">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-[3px]">
                {week.map((day, dayIndex) => (
                  <motion.div
                    key={`${weekIndex}-${dayIndex}`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      delay: weekIndex * 0.01 + dayIndex * 0.002,
                      duration: 0.15,
                    }}
                    className="w-[11px] h-[11px] rounded-sm cursor-pointer transition-all hover:ring-1 hover:ring-white/30"
                    style={{
                      backgroundColor: day.date ? LEVEL_COLORS[day.level] : "transparent",
                    }}
                    onMouseEnter={(e) => handleMouseEnter(day, e)}
                    onMouseLeave={handleMouseLeave}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Stats & Legend */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800">
        {/* Stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-zinc-400">
              <span className="text-zinc-100 font-medium">{totalReviews.toLocaleString()}</span> reviews
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-xs text-zinc-400">
              Longest: <span className="text-zinc-100 font-medium">{longestStreak}</span> days
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-zinc-500">Less</span>
          <div className="flex gap-[2px]">
            {Object.values(LEVEL_COLORS).map((color, i) => (
              <div
                key={i}
                className="w-[10px] h-[10px] rounded-sm"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <span className="text-xs text-zinc-500">More</span>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredDay && hoveredDay.date && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed z-50 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl pointer-events-none"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y,
            transform: "translate(-50%, -100%)",
          }}
        >
          <p className="text-xs font-medium text-zinc-100">
            {hoveredDay.count} {hoveredDay.count === 1 ? "review" : "reviews"}
          </p>
          <p className="text-[10px] text-zinc-400">{formatDate(hoveredDay.date)}</p>
        </motion.div>
      )}
    </div>
  );
}

export default ContributionHeatmap;
