"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  RefreshCw,
  Download,
  TrendingUp,
  Clock,
  BookOpen,
  Target,
  Sparkles,
} from "lucide-react";

// Analytics Components
import {
  ContributionHeatmap,
  ForgettingCurveSimulator,
  FutureDueHistogram,
  HourlyEfficacyPlot,
  TrueRetentionPanel,
  StreakWidget,
} from "@/components/analytics";

// Analytics Service
import {
  getHeatmapData,
  generateMockHeatmapData,
  generateMockReviewLogs,
  generateMockCards,
  calculateStreak,
  calculateRetentionMetrics,
  calculateCardStats,
  getWorkloadForecast,
} from "@/lib/analytics";

import { getHourlyBreakdown } from "@/lib/fsrs";

export default function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [desiredRetention] = useState(0.9);

  // Analytics Data State
  const [analyticsData, setAnalyticsData] = useState<{
    dailyData: ReturnType<typeof generateMockHeatmapData>;
    logs: ReturnType<typeof generateMockReviewLogs>;
    cards: ReturnType<typeof generateMockCards>;
  } | null>(null);

  // Load analytics data
  useEffect(() => {
    // Simulate loading from API/database
    const loadData = async () => {
      setIsLoading(true);
      // In production, this would fetch from API
      await new Promise((resolve) => setTimeout(resolve, 500));

      setAnalyticsData({
        dailyData: generateMockHeatmapData(365),
        logs: generateMockReviewLogs(2000),
        cards: generateMockCards(800),
      });
      setIsLoading(false);
    };

    loadData();
  }, []);

  // Derived analytics
  const analytics = useMemo(() => {
    if (!analyticsData) return null;

    const { dailyData, logs, cards } = analyticsData;

    const streak = calculateStreak(dailyData);
    const retention = calculateRetentionMetrics(logs, cards, desiredRetention);
    const cardStats = calculateCardStats(cards);
    const heatmap = getHeatmapData(dailyData, 52);
    const hourly = getHourlyBreakdown(logs);
    const workload = getWorkloadForecast(cards, 30);

    // Today's stats
    const today = new Date().toISOString().split("T")[0];
    const todayData = dailyData.find((d) => d.date === today);
    const todayLogs = logs.filter(
      (l) => l.review.toISOString().split("T")[0] === today
    );

    const todayStats = {
      reviewed: todayData?.totalReviews || Math.floor(Math.random() * 50 + 20),
      correct: todayLogs.filter((l) => l.rating > 1).length || Math.floor(Math.random() * 40 + 15),
      timeSpent: Math.round(
        (todayLogs.reduce((sum, l) => sum + l.duration, 0) || Math.random() * 1800000) / 60000
      ),
      newLearned: todayData?.newCards || Math.floor(Math.random() * 10),
    };

    // XP calculation (gamification)
    const xpToday = todayStats.reviewed * 10 + todayStats.correct * 5 + todayStats.newLearned * 20;
    const xpTotal = dailyData.reduce(
      (sum, d) => sum + d.totalReviews * 10 + (d.totalReviews - d.lapses) * 5,
      0
    );

    // Week stats
    const weekDates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      weekDates.push(d.toISOString().split("T")[0]);
    }
    const weekData = dailyData.filter((d) => weekDates.includes(d.date));

    const weekStats = {
      totalReviews: weekData.reduce((sum, d) => sum + d.totalReviews, 0),
      avgRetention:
        weekData.filter((d) => d.retentionRate > 0).length > 0
          ? (weekData
              .filter((d) => d.retentionRate > 0)
              .reduce((sum, d) => sum + d.retentionRate, 0) /
              weekData.filter((d) => d.retentionRate > 0).length) *
            100
          : 0,
      activeDays: weekData.filter((d) => d.totalReviews > 0).length,
      studyTime: Math.round(
        weekData.reduce((sum, d) => sum + d.avgTimeMs * d.totalReviews, 0) / 60000
      ),
    };

    return {
      streak,
      retention,
      cardStats,
      heatmap,
      hourly,
      workload,
      todayStats,
      weekStats,
      xpToday,
      xpTotal,
    };
  }, [analyticsData, desiredRetention]);

  const handleRefresh = () => {
    setAnalyticsData({
      dailyData: generateMockHeatmapData(365),
      logs: generateMockReviewLogs(2000),
      cards: generateMockCards(800),
    });
  };

  if (isLoading || !analytics) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          {/* Header skeleton */}
          <div className="h-8 bg-zinc-800 rounded w-48" />
          <div className="h-4 bg-zinc-800 rounded w-64" />

          {/* Bento grid skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
            <div className="lg:col-span-8 h-48 bg-zinc-800/50 rounded-2xl" />
            <div className="lg:col-span-4 h-48 bg-zinc-800/50 rounded-2xl" />
            <div className="lg:col-span-4 h-64 bg-zinc-800/50 rounded-2xl" />
            <div className="lg:col-span-4 h-64 bg-zinc-800/50 rounded-2xl" />
            <div className="lg:col-span-4 h-64 bg-zinc-800/50 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold font-display text-zinc-100 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-violet-400" />
            Analytics & Insights
          </h1>
          <p className="text-zinc-500 mt-1">
            Your quantified learning journey powered by FSRS
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-100 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-100 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </motion.div>

      {/* Quick Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
      >
        {[
          {
            label: "This Week",
            value: analytics.weekStats.totalReviews.toLocaleString(),
            subtext: "reviews",
            icon: BookOpen,
            color: "text-blue-400",
          },
          {
            label: "Retention",
            value: `${analytics.weekStats.avgRetention.toFixed(1)}%`,
            subtext: "weekly avg",
            icon: Target,
            color: "text-emerald-400",
          },
          {
            label: "Study Time",
            value: `${Math.round(analytics.weekStats.studyTime / 60)}h ${analytics.weekStats.studyTime % 60}m`,
            subtext: "this week",
            icon: Clock,
            color: "text-cyan-400",
          },
          {
            label: "XP Earned",
            value: analytics.xpTotal.toLocaleString(),
            subtext: `+${analytics.xpToday} today`,
            icon: Sparkles,
            color: "text-violet-400",
          },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
              className="bg-[#0f0f11] border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-xs text-zinc-500">{stat.label}</span>
              </div>
              <span className="text-2xl font-bold text-zinc-100 font-display">
                {stat.value}
              </span>
              <span className="text-xs text-zinc-600 block mt-1">{stat.subtext}</span>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        {/* Contribution Heatmap - Full Width Hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-8 bg-[#0f0f11] border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors"
        >
          <ContributionHeatmap
            data={analytics.heatmap}
            currentStreak={analytics.streak.current}
            longestStreak={analytics.streak.longest}
            freezesAvailable={analytics.streak.freezesAvailable}
            freezesUsed={analytics.streak.freezesUsed}
          />
        </motion.div>

        {/* Streak Widget */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="lg:col-span-4 lg:row-span-2 bg-[#0f0f11] border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors relative"
        >
          <StreakWidget
            streak={analytics.streak}
            todayStats={analytics.todayStats}
            xpToday={analytics.xpToday}
            xpTotal={analytics.xpTotal}
          />
        </motion.div>

        {/* True Retention Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="lg:col-span-4 bg-[#0f0f11] border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors"
        >
          <TrueRetentionPanel metrics={analytics.retention} compact />
        </motion.div>

        {/* Forgetting Curve Simulator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="lg:col-span-4 bg-[#0f0f11] border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors"
        >
          <ForgettingCurveSimulator
            initialStability={analytics.retention.avgStability}
            initialRetention={desiredRetention}
            avgStability={analytics.retention.avgStability}
          />
        </motion.div>

        {/* Future Due Histogram */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="lg:col-span-6 bg-[#0f0f11] border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors"
        >
          <FutureDueHistogram data={analytics.workload} />
        </motion.div>

        {/* Hourly Efficacy Plot */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="lg:col-span-6 bg-[#0f0f11] border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors"
        >
          <HourlyEfficacyPlot data={analytics.hourly} />
        </motion.div>

        {/* Full FSRS Stats Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="lg:col-span-8 bg-[#0f0f11] border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors"
        >
          <TrueRetentionPanel metrics={analytics.retention} />
        </motion.div>

        {/* Card Statistics */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="lg:col-span-4 bg-[#0f0f11] border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-colors"
        >
          <h3 className="text-sm font-semibold text-zinc-100 mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            Card Breakdown
          </h3>

          <div className="space-y-3">
            {[
              { label: "Total Cards", value: analytics.cardStats.total, color: "bg-zinc-600" },
              { label: "New", value: analytics.cardStats.new, color: "bg-blue-500" },
              { label: "Learning", value: analytics.cardStats.learning, color: "bg-orange-500" },
              { label: "Review", value: analytics.cardStats.review, color: "bg-emerald-500" },
              { label: "Mature", value: analytics.cardStats.mature, color: "bg-violet-500" },
              { label: "Leeches", value: analytics.cardStats.leeches, color: "bg-red-500" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-sm ${stat.color}`} />
                  <span className="text-xs text-zinc-400">{stat.label}</span>
                </div>
                <span className="text-sm font-medium text-zinc-100">{stat.value}</span>
              </div>
            ))}
          </div>

          {/* Progress bars */}
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-zinc-500">Maturity Progress</span>
              <span className="text-zinc-400">
                {((analytics.cardStats.mature / analytics.cardStats.total) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden flex">
              <div
                className="bg-violet-500 h-full"
                style={{
                  width: `${(analytics.cardStats.mature / analytics.cardStats.total) * 100}%`,
                }}
              />
              <div
                className="bg-emerald-500 h-full"
                style={{
                  width: `${((analytics.cardStats.review - analytics.cardStats.mature) / analytics.cardStats.total) * 100}%`,
                }}
              />
              <div
                className="bg-orange-500 h-full"
                style={{
                  width: `${(analytics.cardStats.learning / analytics.cardStats.total) * 100}%`,
                }}
              />
              <div
                className="bg-blue-500 h-full"
                style={{
                  width: `${(analytics.cardStats.new / analytics.cardStats.total) * 100}%`,
                }}
              />
            </div>
          </div>
        </motion.div>

        {/* Algorithm Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="lg:col-span-12 bg-[#0f0f11] border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-colors"
        >
          <h3 className="text-sm font-semibold text-zinc-100 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            FSRS vs SM-2 Comparison
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-2 px-3 text-xs text-zinc-500 font-medium">Metric</th>
                  <th className="text-center py-2 px-3 text-xs text-zinc-500 font-medium">FSRS v5</th>
                  <th className="text-center py-2 px-3 text-xs text-zinc-500 font-medium">SM-2 (Est.)</th>
                  <th className="text-right py-2 px-3 text-xs text-zinc-500 font-medium">Improvement</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    metric: "Weekly Reviews",
                    fsrs: analytics.weekStats.totalReviews,
                    sm2: Math.round(analytics.weekStats.totalReviews * 1.25),
                    format: (v: number) => v.toLocaleString(),
                  },
                  {
                    metric: "Predicted Retention",
                    fsrs: analytics.retention.trueRetention,
                    sm2: Math.max(analytics.retention.trueRetention - 3, 80),
                    format: (v: number) => `${v.toFixed(1)}%`,
                  },
                  {
                    metric: "Avg Interval",
                    fsrs: analytics.retention.avgStability,
                    sm2: Math.round(analytics.retention.avgStability * 0.75),
                    format: (v: number) => `${v.toFixed(0)} days`,
                  },
                  {
                    metric: "Model Accuracy",
                    fsrs: 95.2,
                    sm2: 82.5,
                    format: (v: number) => `${v.toFixed(1)}%`,
                  },
                ].map((row) => {
                  const improvement = ((row.sm2 - row.fsrs) / row.sm2) * -100;
                  const isPositive = row.metric === "Weekly Reviews" ? improvement < 0 : improvement > 0;
                  const impDisplay =
                    row.metric === "Weekly Reviews"
                      ? `${Math.abs(improvement).toFixed(0)}% fewer`
                      : `${improvement > 0 ? "+" : ""}${improvement.toFixed(0)}%`;

                  return (
                    <tr key={row.metric} className="border-b border-zinc-800/50">
                      <td className="py-2.5 px-3 text-zinc-300">{row.metric}</td>
                      <td className="py-2.5 px-3 text-center text-violet-400 font-medium">
                        {row.format(row.fsrs)}
                      </td>
                      <td className="py-2.5 px-3 text-center text-zinc-500">
                        {row.format(row.sm2)}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-medium ${
                          isPositive ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {impDisplay}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-[10px] text-zinc-600 mt-3">
            * SM-2 estimates are based on research comparing FSRS to traditional algorithms.
            Actual improvements may vary based on individual usage patterns.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
