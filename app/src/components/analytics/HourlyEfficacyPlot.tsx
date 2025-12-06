"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Clock, TrendingDown, Lightbulb, AlertTriangle } from "lucide-react";

interface HourlyStats {
  hour: number;
  count: number;
  retention: number;
}

interface HourlyEfficacyPlotProps {
  data: HourlyStats[];
  userTimezone?: string;
}

// Format hour for display
const formatHour = (hour: number): string => {
  if (hour === 0) return "12am";
  if (hour === 12) return "12pm";
  if (hour < 12) return `${hour}am`;
  return `${hour - 12}pm`;
};

export function HourlyEfficacyPlot({
  data,
  userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
}: HourlyEfficacyPlotProps) {
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  // Analyze data for insights
  const {
    maxCount,
    maxRetention,
    minRetention,
    peakHours,
    lowHours,
    cognitiveCliff,
    insight,
  } = useMemo(() => {
    const activeHours = data.filter((d) => d.count > 0);
    const maxC = Math.max(...data.map((d) => d.count), 1);
    const maxR = Math.max(...activeHours.map((d) => d.retention), 100);
    const minR = Math.min(...activeHours.map((d) => d.retention), 0);

    // Find peak performance hours (top 3)
    const sortedByRetention = [...activeHours]
      .filter((d) => d.count >= 5) // Minimum sample size
      .sort((a, b) => b.retention - a.retention);
    const peaks = sortedByRetention.slice(0, 3).map((d) => d.hour);

    // Find low performance hours (bottom 3)
    const lows = sortedByRetention.slice(-3).map((d) => d.hour).reverse();

    // Detect "cognitive cliff" - sudden drop in retention with high volume
    let cliff: number | null = null;
    for (let i = 1; i < data.length; i++) {
      const prev = data[i - 1];
      const curr = data[i];
      if (
        prev.count > maxC * 0.2 &&
        curr.count > maxC * 0.2 &&
        prev.retention - curr.retention > 10
      ) {
        cliff = curr.hour;
        break;
      }
    }

    // Generate insight
    let insightText = "";
    if (cliff !== null) {
      insightText = `Performance drops after ${formatHour(cliff)}. Consider studying earlier.`;
    } else if (peaks.length > 0) {
      insightText = `Your peak hours are ${peaks.slice(0, 2).map(formatHour).join(" and ")}. Schedule important reviews then.`;
    }

    return {
      maxCount: maxC,
      maxRetention: maxR,
      minRetention: minR,
      peakHours: peaks,
      lowHours: lows,
      cognitiveCliff: cliff,
      insight: insightText,
    };
  }, [data]);

  // SVG dimensions
  const width = 100;
  const height = 60;
  const barWidth = 100 / 24;
  const barGap = barWidth * 0.2;

  // Create retention line path
  const retentionPath = useMemo(() => {
    const activeData = data.filter((d) => d.count > 0);
    if (activeData.length < 2) return "";

    const xScale = (hour: number) => (hour / 23) * width;
    const yScale = (retention: number) => {
      const normalized = (retention - minRetention) / (maxRetention - minRetention || 1);
      return height - normalized * height * 0.8 - height * 0.1;
    };

    const points = activeData.map((d) => `${xScale(d.hour)},${yScale(d.retention)}`);
    return `M ${points.join(" L ")}`;
  }, [data, minRetention, maxRetention, width, height]);

  // Get bar color based on retention
  const getBarColor = (retention: number, hour: number) => {
    if (retention === 0) return "#27272a"; // No data
    if (peakHours.includes(hour)) return "#22c55e"; // Peak hours
    if (lowHours.includes(hour)) return "#f97316"; // Low hours
    if (hour === cognitiveCliff) return "#ef4444"; // Cliff
    return "#3b82f6"; // Normal
  };

  // Get retention line color
  const getLineColor = (hour: number) => {
    if (hour === cognitiveCliff) return "#ef4444";
    return "#a78bfa";
  };

  return (
    <div className="h-full flex flex-col p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-zinc-100">Hourly Performance</h3>
        </div>
        <span className="text-[10px] text-zinc-500">{userTimezone}</span>
      </div>

      {/* Chart */}
      <div className="flex-1 relative min-h-[100px]">
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full h-full">
          {/* Grid lines */}
          {[0, 50, 100].map((y) => (
            <line
              key={y}
              x1="0"
              y1={height - (y / 100) * height * 0.8 - height * 0.1}
              x2={width}
              y2={height - (y / 100) * height * 0.8 - height * 0.1}
              stroke="#27272a"
              strokeWidth="0.3"
            />
          ))}

          {/* Bars (volume) */}
          {data.map((d, i) => {
            const x = i * barWidth + barGap / 2;
            const actualBarWidth = barWidth - barGap;
            const barHeight = (d.count / maxCount) * height * 0.7;

            return (
              <motion.rect
                key={d.hour}
                x={x}
                y={height - barHeight}
                width={actualBarWidth}
                height={barHeight}
                fill={getBarColor(d.retention, d.hour)}
                opacity={hoveredHour === d.hour ? 1 : 0.6}
                rx="0.5"
                initial={{ height: 0, y: height }}
                animate={{ height: barHeight, y: height - barHeight }}
                transition={{ delay: i * 0.02, duration: 0.3 }}
                onMouseEnter={() => setHoveredHour(d.hour)}
                onMouseLeave={() => setHoveredHour(null)}
                className="cursor-pointer"
              />
            );
          })}

          {/* Retention line */}
          <motion.path
            d={retentionPath}
            fill="none"
            stroke="#a78bfa"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          />

          {/* Cognitive cliff marker */}
          {cognitiveCliff !== null && (
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <line
                x1={(cognitiveCliff / 23) * width}
                y1="0"
                x2={(cognitiveCliff / 23) * width}
                y2={height}
                stroke="#ef4444"
                strokeWidth="0.5"
                strokeDasharray="2,1"
              />
              <circle
                cx={(cognitiveCliff / 23) * width}
                cy="5"
                r="3"
                fill="#ef4444"
              />
              <text
                x={(cognitiveCliff / 23) * width}
                y="4"
                fill="white"
                fontSize="3"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                !
              </text>
            </motion.g>
          )}
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[8px] text-zinc-500 -translate-x-4">
          <span>{maxRetention.toFixed(0)}%</span>
          <span>{((maxRetention + minRetention) / 2).toFixed(0)}%</span>
          <span>{minRetention.toFixed(0)}%</span>
        </div>

        {/* X-axis labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[8px] text-zinc-500 translate-y-3">
          <span>12am</span>
          <span>6am</span>
          <span>12pm</span>
          <span>6pm</span>
          <span>11pm</span>
        </div>

        {/* Hover tooltip */}
        {hoveredHour !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-0 left-1/2 -translate-x-1/2 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 pointer-events-none z-10"
          >
            <p className="text-[10px] text-zinc-100 font-medium">
              {formatHour(hoveredHour)}
            </p>
            <p className="text-[9px] text-zinc-400">
              {data[hoveredHour].count} reviews · {data[hoveredHour].retention.toFixed(1)}%
            </p>
          </motion.div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-2 border-t border-zinc-800">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
          <span className="text-[10px] text-zinc-400">Volume</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 rounded bg-violet-400" />
          <span className="text-[10px] text-zinc-400">Retention</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-green-500" />
          <span className="text-[10px] text-zinc-400">Peak</span>
        </div>
        {cognitiveCliff !== null && (
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 flex items-center justify-center text-[6px] text-white font-bold">
              !
            </div>
            <span className="text-[10px] text-zinc-400">Cliff</span>
          </div>
        )}
      </div>

      {/* Insight */}
      {insight && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex items-start gap-2 p-2 bg-zinc-900/50 rounded-lg"
        >
          <Lightbulb className="w-3.5 h-3.5 text-yellow-400 mt-0.5 shrink-0" />
          <p className="text-[10px] text-zinc-300">{insight}</p>
        </motion.div>
      )}
    </div>
  );
}

export default HourlyEfficacyPlot;
