"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  Trophy,
  Zap,
  Star,
  Crown,
  Target,
  Calendar,
  Snowflake,
  Gift,
  Sparkles,
} from "lucide-react";

interface StreakData {
  current: number;
  longest: number;
  lastActiveDate: string;
  freezesAvailable: number;
  freezesUsed: number;
}

interface TodayStats {
  reviewed: number;
  correct: number;
  timeSpent: number; // minutes
  newLearned: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: typeof Flame;
  color: string;
  unlockedAt?: Date;
  progress?: number; // 0-100
}

interface StreakWidgetProps {
  streak: StreakData;
  todayStats: TodayStats;
  xpToday?: number;
  xpTotal?: number;
}

// Milestones for streak achievements
const STREAK_MILESTONES = [7, 14, 30, 60, 90, 180, 365];

// Calculate streak tier
const getStreakTier = (streak: number) => {
  if (streak >= 365) return { name: "Legendary", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", icon: Crown };
  if (streak >= 180) return { name: "Master", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/30", icon: Star };
  if (streak >= 90) return { name: "Expert", color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/30", icon: Trophy };
  if (streak >= 30) return { name: "Dedicated", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: Zap };
  if (streak >= 7) return { name: "Rising", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", icon: Target };
  return { name: "Starter", color: "text-zinc-400", bg: "bg-zinc-500/10", border: "border-zinc-500/30", icon: Flame };
};

// Find next milestone
const getNextMilestone = (current: number) => {
  return STREAK_MILESTONES.find(m => m > current) || current + 100;
};

export function StreakWidget({ streak, todayStats, xpToday = 0, xpTotal = 0 }: StreakWidgetProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);

  const tier = useMemo(() => getStreakTier(streak.current), [streak.current]);
  const nextMilestone = useMemo(() => getNextMilestone(streak.current), [streak.current]);
  const progressToNext = ((streak.current % (nextMilestone - (STREAK_MILESTONES[STREAK_MILESTONES.indexOf(nextMilestone) - 1] || 0))) /
    (nextMilestone - (STREAK_MILESTONES[STREAK_MILESTONES.indexOf(nextMilestone) - 1] || 0))) * 100;

  const TierIcon = tier.icon;

  // Check if streak milestone was hit
  useEffect(() => {
    if (STREAK_MILESTONES.includes(streak.current) && streak.current > 0) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }
  }, [streak.current]);

  // Generate sample achievements
  const achievements: Achievement[] = useMemo(() => [
    {
      id: "first-week",
      title: "First Week",
      description: "Complete 7 days in a row",
      icon: Calendar,
      color: "text-blue-400",
      unlockedAt: streak.current >= 7 ? new Date() : undefined,
      progress: Math.min((streak.current / 7) * 100, 100),
    },
    {
      id: "month-master",
      title: "Month Master",
      description: "30 day streak",
      icon: Trophy,
      color: "text-emerald-400",
      unlockedAt: streak.longest >= 30 ? new Date() : undefined,
      progress: Math.min((Math.max(streak.current, streak.longest) / 30) * 100, 100),
    },
    {
      id: "perfectionist",
      title: "Perfectionist",
      description: "95%+ retention in a day",
      icon: Target,
      color: "text-violet-400",
      unlockedAt: todayStats.reviewed > 0 && (todayStats.correct / todayStats.reviewed) >= 0.95 ? new Date() : undefined,
    },
    {
      id: "centurion",
      title: "Centurion",
      description: "Review 100 cards in a day",
      icon: Zap,
      color: "text-yellow-400",
      unlockedAt: todayStats.reviewed >= 100 ? new Date() : undefined,
      progress: Math.min((todayStats.reviewed / 100) * 100, 100),
    },
  ], [streak, todayStats]);

  return (
    <div className="h-full flex flex-col p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-400" />
          <h3 className="text-sm font-semibold text-zinc-100">Your Streak</h3>
        </div>
        <button
          onClick={() => setShowAchievements(!showAchievements)}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Achievements</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {!showAchievements ? (
          <motion.div
            key="streak"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col"
          >
            {/* Main Streak Display */}
            <div className="flex items-center gap-4 mb-4">
              <motion.div
                animate={{
                  scale: showCelebration ? [1, 1.2, 1] : 1,
                }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                <div className={`w-20 h-20 rounded-2xl ${tier.bg} ${tier.border} border flex items-center justify-center`}>
                  <Flame className={`w-10 h-10 ${streak.current > 0 ? "text-orange-400" : "text-zinc-600"}`} />
                </div>
                {/* Streak number badge */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-lg"
                >
                  <span className="text-white text-sm font-bold">{streak.current}</span>
                </motion.div>
              </motion.div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <TierIcon className={`w-4 h-4 ${tier.color}`} />
                  <span className={`text-sm font-medium ${tier.color}`}>{tier.name}</span>
                </div>
                <p className="text-xs text-zinc-500 mb-2">
                  {streak.current === 0
                    ? "Start studying to build your streak!"
                    : `${streak.current} day${streak.current === 1 ? "" : "s"} and counting`}
                </p>

                {/* Progress to next milestone */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-zinc-500">Next: {nextMilestone} days</span>
                    <span className="text-zinc-400">{nextMilestone - streak.current} to go</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressToNext}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Streak Freezes */}
            <div className="flex items-center justify-between mb-4 p-2.5 bg-zinc-900/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Snowflake className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-zinc-400">Streak Freezes</span>
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: streak.freezesAvailable + streak.freezesUsed }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-5 h-5 rounded flex items-center justify-center ${
                      i < streak.freezesUsed
                        ? "bg-zinc-700"
                        : "bg-cyan-500/20 border border-cyan-500/30"
                    }`}
                  >
                    <Snowflake
                      className={`w-3 h-3 ${
                        i < streak.freezesUsed ? "text-zinc-500" : "text-cyan-400"
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Today's Summary */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-zinc-900/50 rounded-lg p-2.5">
                <span className="text-[10px] text-zinc-500 block mb-0.5">Today</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-zinc-100">{todayStats.reviewed}</span>
                  <span className="text-xs text-zinc-500">cards</span>
                </div>
              </div>
              <div className="bg-zinc-900/50 rounded-lg p-2.5">
                <span className="text-[10px] text-zinc-500 block mb-0.5">Accuracy</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-emerald-400">
                    {todayStats.reviewed > 0
                      ? Math.round((todayStats.correct / todayStats.reviewed) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* XP Display */}
            <div className="flex items-center justify-between p-2.5 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <div>
                  <span className="text-xs text-zinc-400 block">Today's XP</span>
                  <span className="text-sm font-bold text-violet-400">+{xpToday}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-zinc-500 block">Total</span>
                <span className="text-sm font-medium text-zinc-300">{xpTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Longest Streak */}
            <div className="mt-auto pt-3 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-zinc-500">Longest streak</span>
              <div className="flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-sm font-medium text-zinc-100">{streak.longest} days</span>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="achievements"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 flex flex-col"
          >
            {/* Achievements List */}
            <div className="space-y-2 flex-1 overflow-auto">
              {achievements.map((achievement) => {
                const AchIcon = achievement.icon;
                const isUnlocked = !!achievement.unlockedAt;

                return (
                  <div
                    key={achievement.id}
                    className={`p-3 rounded-lg border transition-colors ${
                      isUnlocked
                        ? "bg-zinc-900/50 border-zinc-700"
                        : "bg-zinc-900/20 border-zinc-800"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isUnlocked ? "bg-zinc-800" : "bg-zinc-900"
                        }`}
                      >
                        <AchIcon
                          className={`w-5 h-5 ${
                            isUnlocked ? achievement.color : "text-zinc-600"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${isUnlocked ? "text-zinc-100" : "text-zinc-500"}`}>
                          {achievement.title}
                        </p>
                        <p className="text-[10px] text-zinc-500">{achievement.description}</p>
                        {!isUnlocked && achievement.progress !== undefined && (
                          <div className="mt-1.5 h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${achievement.color.replace("text-", "bg-")} rounded-full`}
                              style={{ width: `${achievement.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                      {isUnlocked && (
                        <div className="w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center">
                          <Star className="w-3 h-3 text-emerald-400" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Back button */}
            <button
              onClick={() => setShowAchievements(false)}
              className="mt-3 pt-3 border-t border-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              ← Back to streak
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl z-10"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              className="text-center"
            >
              <Gift className="w-16 h-16 text-yellow-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-white">🎉 Milestone!</p>
              <p className="text-sm text-zinc-300">{streak.current} day streak</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default StreakWidget;
