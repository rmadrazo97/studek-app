"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Flame,
  Zap,
  Target,
  Calendar,
  TrendingUp,
  Award,
  Sparkles,
  Crown,
  Shield,
  Star,
  BookOpen,
  Brain,
  Timer,
  Settings,
  Play,
  RefreshCw,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/stores/auth";
import { Button } from "@/components/ui/Button";
import { api, apiClient } from "@/lib/api/client";
import { ContributionHeatmap } from "@/components/analytics";

// Types
interface StatsData {
  xp: {
    total: number;
    weekly: number;
    daily: number;
    dailyGoal: number;
  };
  level: {
    current: number;
    xpProgress: number;
    xpNeeded: number;
    progress: number;
  };
  streak: {
    current: number;
    longest: number;
    isActive: boolean;
    goalMet: boolean;
    freezesAvailable: number;
    lastStudyDate: string | null;
  };
  league: {
    tier: {
      id: number;
      name: string;
      icon: string;
      color: string;
    };
    rank: number;
    totalInCohort: number;
    weeklyXP: number;
    isInPromotionZone: boolean;
    isInDemotionZone: boolean;
  };
  totals: {
    reviews: number;
    correct: number;
    studyTimeMs: number;
    bestCombo: number;
  };
  achievements: {
    unlocked: Array<{
      id: string;
      name: string;
      description: string;
      icon: string;
      rarity: string;
      unlockedAt: string;
    }>;
    progress: {
      streak: Array<{ name: string; target: number; current: number }>;
      reviews: Array<{ name: string; target: number; current: number }>;
    };
  };
}

interface SessionData {
  sessions: Array<{
    id: string;
    deckId: string;
    deckName: string;
    startedAt: string;
    endedAt: string;
    cardsReviewed: number;
    cardsCorrect: number;
    accuracy: number;
    durationMs: number;
    xpEarned: number;
  }>;
  stats: {
    totalSessions: number;
    totalCards: number;
    totalCorrect: number;
    totalTimeMs: number;
    avgCardsPerSession: number;
    avgDurationMinutes: number;
    bestSessionCards: number;
    overallAccuracy: number;
  };
  bestDeck: {
    id: string;
    name: string;
    accuracy: number;
  } | null;
}

interface AnalyticsData {
  heatmap: Array<{ date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }>;
  streak: {
    current: number;
    longest: number;
    freezesAvailable: number;
    freezesUsed: number;
    lastActiveDate: string | null;
  };
  retention: {
    trueRetention: number;
    desiredRetention: number;
    avgRetrievability: number;
    avgStability: number;
    avgDifficulty: number;
    trend: number;
    historyData: number[];
  };
  cardStats: {
    total: number;
    new: number;
    learning: number;
    review: number;
    relearning: number;
    mature: number;
    young: number;
    suspended: number;
    leeches: number;
  };
  weekStats: {
    totalReviews: number;
    avgRetention: number;
    avgTimePerDay: number;
    activeDays: number;
    studyTime: number;
  };
  xp: {
    today: number;
    total: number;
    weekly: number;
  };
}

// Tier icons and colors
const TIER_CONFIG: Record<string, { icon: typeof Crown; color: string; bgColor: string }> = {
  Bronze: { icon: Shield, color: "text-amber-600", bgColor: "bg-amber-600/20" },
  Silver: { icon: Shield, color: "text-zinc-400", bgColor: "bg-zinc-400/20" },
  Gold: { icon: Crown, color: "text-yellow-400", bgColor: "bg-yellow-400/20" },
  Diamond: { icon: Sparkles, color: "text-cyan-400", bgColor: "bg-cyan-400/20" },
  Champion: { icon: Trophy, color: "text-violet-400", bgColor: "bg-violet-400/20" },
};

// Achievement rarity colors
const RARITY_COLORS: Record<string, string> = {
  common: "from-zinc-600 to-zinc-700 border-zinc-500",
  rare: "from-blue-600 to-blue-700 border-blue-500",
  epic: "from-violet-600 to-violet-700 border-violet-500",
  legendary: "from-amber-500 to-orange-600 border-amber-400",
};

export default function ProfilePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [sessions, setSessions] = useState<SessionData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);

    try {
      const [statsData, sessionsData, analyticsData] = await Promise.all([
        api<StatsData>('/api/stats').catch(() => null),
        api<SessionData>('/api/sessions?limit=5').catch(() => null),
        apiClient.get<AnalyticsData>('/api/analytics').catch(() => null),
      ]);

      if (statsData) {
        setStats(statsData);
      }

      if (sessionsData) {
        setSessions(sessionsData);
      }

      if (analyticsData) {
        setAnalytics(analyticsData);
      }
    } catch (err) {
      console.error('Error loading profile data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-48 bg-zinc-800/50 rounded-2xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-zinc-800/50 rounded-xl" />
            ))}
          </div>
          <div className="h-48 bg-zinc-800/50 rounded-2xl" />
          <div className="h-64 bg-zinc-800/50 rounded-2xl" />
        </div>
      </div>
    );
  }

  const tierConfig = stats?.league?.tier
    ? TIER_CONFIG[stats.league.tier.name] || TIER_CONFIG.Bronze
    : TIER_CONFIG.Bronze;
  const TierIcon = tierConfig.icon;

  // Calculate retention trend indicator
  const retentionTrend = analytics?.retention?.trend || 0;
  const retentionTrendColor = retentionTrend > 0 ? 'text-emerald-400' : retentionTrend < 0 ? 'text-red-400' : 'text-zinc-500';

  return (
    <div className="max-w-5xl mx-auto pb-8">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-zinc-800 rounded-2xl p-6 mb-6"
      >
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          {/* Avatar & Basic Info */}
          <div className="flex items-center gap-4 flex-1">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.3)]">
                <span className="text-3xl font-bold text-[#09090b]">
                  {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "?"}
                </span>
              </div>
              {/* Level Badge */}
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-violet-500 border-2 border-[#09090b] flex items-center justify-center">
                <span className="text-xs font-bold text-white">{stats?.level?.current || 1}</span>
              </div>
            </div>

            <div>
              <h1 className="text-2xl font-bold text-zinc-100">
                {user?.name || "Learner"}
              </h1>
              <p className="text-sm text-zinc-500">{user?.email}</p>
              <div className="flex items-center gap-3 mt-2">
                {/* League Badge */}
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${tierConfig.bgColor}`}>
                  <TierIcon className={`w-4 h-4 ${tierConfig.color}`} />
                  <span className={`text-xs font-semibold ${tierConfig.color}`}>
                    {stats?.league?.tier?.name || "Bronze"}
                  </span>
                </div>
                {/* Rank */}
                {stats?.league?.rank && (
                  <span className="text-xs text-zinc-500">
                    #{stats.league.rank} of {stats.league.totalInCohort}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-100 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <Link href="/settings">
              <Button variant="ghost" size="sm" icon={<Settings className="w-4 h-4" />}>
                Settings
              </Button>
            </Link>
          </div>
        </div>

        {/* Level Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-zinc-400">Level {stats?.level?.current || 1}</span>
            <span className="text-zinc-500">
              {stats?.level?.xpProgress?.toLocaleString() || 0} / {stats?.level?.xpNeeded?.toLocaleString() || 100} XP
            </span>
          </div>
          <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(stats?.level?.progress || 0) * 100}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full"
            />
          </div>
        </div>
      </motion.div>

      {/* Quick Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
      >
        {/* Streak */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Flame className={`w-5 h-5 ${stats?.streak?.isActive ? 'text-orange-400' : 'text-zinc-500'}`} />
            <span className="text-xs text-zinc-500">Streak</span>
          </div>
          <div className="text-2xl font-bold text-zinc-100">
            {stats?.streak?.current || analytics?.streak?.current || 0}
            <span className="text-sm font-normal text-zinc-500 ml-1">days</span>
          </div>
          <div className="text-xs text-zinc-600 mt-1">
            Best: {stats?.streak?.longest || analytics?.streak?.longest || 0} days
          </div>
        </div>

        {/* Total XP */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-violet-400" />
            <span className="text-xs text-zinc-500">Total XP</span>
          </div>
          <div className="text-2xl font-bold text-zinc-100">
            {(stats?.xp?.total || analytics?.xp?.total || 0).toLocaleString()}
          </div>
          <div className="text-xs text-emerald-400 mt-1">
            +{stats?.xp?.daily || analytics?.xp?.today || 0} today
          </div>
        </div>

        {/* Reviews */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <span className="text-xs text-zinc-500">Reviews</span>
          </div>
          <div className="text-2xl font-bold text-zinc-100">
            {(stats?.totals?.reviews || 0).toLocaleString()}
          </div>
          <div className="text-xs text-zinc-600 mt-1">
            {sessions?.stats?.overallAccuracy || 0}% accuracy
          </div>
        </div>

        {/* Retention */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-emerald-400" />
            <span className="text-xs text-zinc-500">Retention</span>
          </div>
          <div className="text-2xl font-bold text-zinc-100">
            {(analytics?.retention?.trueRetention || 0).toFixed(1)}%
          </div>
          <div className={`text-xs mt-1 flex items-center gap-1 ${retentionTrendColor}`}>
            <TrendingUp className={`w-3 h-3 ${retentionTrend < 0 ? 'rotate-180' : ''}`} />
            {retentionTrend > 0 ? '+' : ''}{retentionTrend.toFixed(1)}% this week
          </div>
        </div>
      </motion.div>

      {/* Contribution Heatmap */}
      {analytics?.heatmap && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden mb-6 hover:border-zinc-700 transition-colors"
        >
          <ContributionHeatmap
            data={analytics.heatmap}
            currentStreak={stats?.streak?.current || analytics.streak?.current || 0}
            longestStreak={stats?.streak?.longest || analytics.streak?.longest || 0}
            freezesAvailable={analytics.streak?.freezesAvailable || stats?.streak?.freezesAvailable || 0}
            freezesUsed={analytics.streak?.freezesUsed || 0}
          />
        </motion.div>
      )}

      {/* Daily Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" />
            Daily Goal
          </h2>
          <span className={`text-sm font-medium ${stats?.streak?.goalMet ? 'text-emerald-400' : 'text-zinc-500'}`}>
            {stats?.xp?.daily || 0} / {stats?.xp?.dailyGoal || 50} XP
          </span>
        </div>

        <div className="h-4 bg-zinc-800 rounded-full overflow-hidden mb-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(((stats?.xp?.daily || 0) / (stats?.xp?.dailyGoal || 50)) * 100, 100)}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-full rounded-full ${
              stats?.streak?.goalMet
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500'
                : 'bg-gradient-to-r from-violet-500 to-cyan-500'
            }`}
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500">
            {stats?.streak?.goalMet
              ? "Goal completed! Keep going!"
              : `${(stats?.xp?.dailyGoal || 50) - (stats?.xp?.daily || 0)} XP to maintain streak`}
          </span>
          {stats?.streak?.freezesAvailable && stats.streak.freezesAvailable > 0 && (
            <span className="text-cyan-400 flex items-center gap-1">
              <Shield className="w-3 h-3" />
              {stats.streak.freezesAvailable} freeze{stats.streak.freezesAvailable !== 1 ? 's' : ''} available
            </span>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Achievements Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Achievements
            </h2>
            <span className="text-xs text-zinc-500">
              {stats?.achievements?.unlocked?.length || 0} unlocked
            </span>
          </div>

          {stats?.achievements?.unlocked && stats.achievements.unlocked.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {stats.achievements.unlocked.slice(0, 4).map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-3 rounded-xl border bg-gradient-to-br ${RARITY_COLORS[achievement.rarity] || RARITY_COLORS.common}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="w-4 h-4 text-white" />
                    <span className="text-xs font-medium text-white/90 truncate">
                      {achievement.name}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/60 line-clamp-1">
                    {achievement.description}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Award className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
              <p className="text-sm text-zinc-500">No achievements yet</p>
              <p className="text-xs text-zinc-600 mt-1">Keep studying to unlock!</p>
            </div>
          )}

          {/* Achievement Progress */}
          {stats?.achievements?.progress && (
            <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
              <p className="text-xs text-zinc-500 font-medium">Next Achievements</p>
              {[
                ...(stats.achievements.progress.streak || []).slice(0, 1),
                ...(stats.achievements.progress.reviews || []).slice(0, 1),
              ].map((prog, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-zinc-400">{prog.name}</span>
                    <span className="text-zinc-500">
                      {prog.current} / {prog.target}
                    </span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                      style={{ width: `${Math.min((prog.current / prog.target) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Performance & FSRS Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5"
        >
          <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-emerald-400" />
            Performance & Insights
          </h2>

          <div className="space-y-4">
            {/* Best Combo */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-zinc-400">Best Combo</span>
              </div>
              <span className="text-sm font-semibold text-zinc-100">
                {stats?.totals?.bestCombo || 0} cards
              </span>
            </div>

            {/* Avg Cards Per Session */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-violet-400" />
                <span className="text-sm text-zinc-400">Avg per Session</span>
              </div>
              <span className="text-sm font-semibold text-zinc-100">
                {sessions?.stats?.avgCardsPerSession || 0} cards
              </span>
            </div>

            {/* Avg Session Duration */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-cyan-400" />
                <span className="text-sm text-zinc-400">Avg Duration</span>
              </div>
              <span className="text-sm font-semibold text-zinc-100">
                {sessions?.stats?.avgDurationMinutes || 0} min
              </span>
            </div>

            {/* FSRS Metrics */}
            <div className="pt-3 border-t border-zinc-800">
              <p className="text-xs text-zinc-500 mb-3 font-medium">FSRS Memory Metrics</p>

              <div className="grid grid-cols-2 gap-3">
                {/* Stability */}
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-[10px] text-zinc-500 mb-1">Avg Stability</p>
                  <p className="text-sm font-semibold text-violet-400">
                    {(analytics?.retention?.avgStability || 0).toFixed(1)} days
                  </p>
                </div>

                {/* Difficulty */}
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-[10px] text-zinc-500 mb-1">Avg Difficulty</p>
                  <p className="text-sm font-semibold text-orange-400">
                    {(analytics?.retention?.avgDifficulty || 5).toFixed(1)}/10
                  </p>
                </div>
              </div>
            </div>

            {/* Best Deck */}
            {sessions?.bestDeck && (
              <div className="pt-3 border-t border-zinc-800">
                <p className="text-xs text-zinc-500 mb-2">Best Performing Deck</p>
                <div className="flex items-center justify-between bg-zinc-800/50 rounded-lg p-3">
                  <span className="text-sm text-zinc-300 truncate max-w-[60%]">
                    {sessions.bestDeck.name}
                  </span>
                  <span className="text-sm font-semibold text-emerald-400">
                    {sessions.bestDeck.accuracy}% acc
                  </span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Card Statistics (from analytics) */}
      {analytics?.cardStats && analytics.cardStats.total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 mb-6"
        >
          <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            Card Collection
          </h2>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
            {[
              { label: "Total", value: analytics.cardStats.total, color: "bg-zinc-600" },
              { label: "New", value: analytics.cardStats.new, color: "bg-blue-500" },
              { label: "Learning", value: analytics.cardStats.learning, color: "bg-orange-500" },
              { label: "Review", value: analytics.cardStats.review, color: "bg-emerald-500" },
              { label: "Mature", value: analytics.cardStats.mature, color: "bg-violet-500" },
              { label: "Leeches", value: analytics.cardStats.leeches, color: "bg-red-500" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <div className={`w-2 h-2 rounded-sm ${stat.color}`} />
                  <span className="text-[10px] text-zinc-500">{stat.label}</span>
                </div>
                <p className="text-lg font-semibold text-zinc-100">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Maturity Progress */}
          <div className="pt-3 border-t border-zinc-800">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-zinc-500">Maturity Progress</span>
              <span className="text-zinc-400">
                {((analytics.cardStats.mature / analytics.cardStats.total) * 100).toFixed(1)}% mature
              </span>
            </div>
            <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden flex">
              <div
                className="bg-violet-500 h-full"
                style={{
                  width: `${(analytics.cardStats.mature / analytics.cardStats.total) * 100}%`,
                }}
              />
              <div
                className="bg-emerald-500 h-full"
                style={{
                  width: `${(Math.max(0, analytics.cardStats.review - analytics.cardStats.mature) / analytics.cardStats.total) * 100}%`,
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
      )}

      {/* Recent Sessions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            Recent Sessions
          </h2>
          <span className="text-xs text-zinc-500">
            {sessions?.stats?.totalSessions || 0} total sessions
          </span>
        </div>

        {sessions?.sessions && sessions.sessions.length > 0 ? (
          <div className="space-y-3">
            {sessions.sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-xl hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                    <Play className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-100 truncate">
                      {session.deckName}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {session.cardsReviewed} cards · {formatDuration(session.durationMs)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${
                      session.accuracy >= 80 ? 'text-emerald-400' :
                      session.accuracy >= 60 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {session.accuracy}%
                    </p>
                    <p className="text-xs text-violet-400">+{session.xpEarned} XP</p>
                  </div>
                  <span className="text-xs text-zinc-600">{formatDate(session.startedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <BookOpen className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
            <p className="text-sm text-zinc-500">No sessions yet</p>
            <Link href="/dashboard">
              <Button variant="primary" size="sm" className="mt-3">
                Start Studying
              </Button>
            </Link>
          </div>
        )}
      </motion.div>

      {/* League Standing */}
      {stats?.league && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 mt-6"
        >
          <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2 mb-4">
            <TierIcon className={`w-5 h-5 ${tierConfig.color}`} />
            League Standing
          </h2>

          <div className="flex items-center justify-between">
            <div>
              <p className={`text-2xl font-bold ${tierConfig.color}`}>
                {stats.league.tier.name} League
              </p>
              <p className="text-sm text-zinc-500 mt-1">
                Rank #{stats.league.rank} of {stats.league.totalInCohort}
              </p>
            </div>

            <div className="text-right">
              <p className="text-2xl font-bold text-zinc-100">
                {stats.league.weeklyXP.toLocaleString()}
              </p>
              <p className="text-sm text-zinc-500">Weekly XP</p>
            </div>
          </div>

          {/* Zone Indicator */}
          <div className="mt-4 pt-4 border-t border-zinc-800">
            {stats.league.isInPromotionZone ? (
              <div className="flex items-center gap-2 text-sm text-emerald-400">
                <TrendingUp className="w-4 h-4" />
                <span>In promotion zone! Keep it up!</span>
              </div>
            ) : stats.league.isInDemotionZone ? (
              <div className="flex items-center gap-2 text-sm text-red-400">
                <TrendingUp className="w-4 h-4 rotate-180" />
                <span>In demotion zone. Study more to stay in this league!</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <Target className="w-4 h-4" />
                <span>Safe zone. Keep studying to climb!</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
