"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Flame,
  Zap,
  Target,
  TrendingUp,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Star,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

// Custom confetti implementation (no external dependency)
function createConfetti(options: {
  particleCount?: number;
  spread?: number;
  origin?: { x?: number; y?: number };
  colors?: string[];
}) {
  const {
    particleCount = 50,
    spread = 60,
    origin = { x: 0.5, y: 0.6 },
    colors = ["#10b981", "#06b6d4", "#8b5cf6"],
  } = options;

  // Create canvas if it doesn't exist
  let canvas = document.getElementById("confetti-canvas") as HTMLCanvasElement | null;
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = "confetti-canvas";
    canvas.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999";
    document.body.appendChild(canvas);
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    size: number;
    rotation: number;
    rotationSpeed: number;
    opacity: number;
  }[] = [];

  const originX = (origin.x ?? 0.5) * canvas.width;
  const originY = (origin.y ?? 0.5) * canvas.height;
  const spreadRad = (spread * Math.PI) / 180;

  for (let i = 0; i < particleCount; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * spreadRad;
    const velocity = 8 + Math.random() * 8;
    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 6 + Math.random() * 6,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      opacity: 1,
    });
  }

  let animationId: number;
  const gravity = 0.3;
  const friction = 0.99;

  function animate() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let activeParticles = 0;
    for (const p of particles) {
      if (p.opacity <= 0) continue;
      activeParticles++;

      p.vy += gravity;
      p.vx *= friction;
      p.vy *= friction;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.opacity -= 0.01;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }

    if (activeParticles > 0) {
      animationId = requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  animate();
}

interface XPBreakdown {
  baseXP: number;
  newCardXP: number;
  comboXP: number;
  speedXP: number;
  difficultyXP: number;
  accuracyBonus: number;
  streakBonus: number;
}

interface SessionStats {
  cardsReviewed: number;
  cardsCorrect: number;
  accuracy: number;
  bestCombo: number;
  avgTimeMs: number;
  totalDurationMs: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  rarity: "common" | "rare" | "epic" | "legendary";
}

interface SessionSummaryProps {
  session: SessionStats;
  xp: {
    total: number;
    breakdown: XPBreakdown;
  };
  stats: {
    totalXP: number;
    dailyXP: number;
    dailyGoal: number;
    streak: number;
    longestStreak: number;
    streakIncreased: boolean;
    freezesAvailable: number;
  };
  level: {
    current: number;
    xpProgress: number;
    xpNeeded: number;
    progress: number;
    leveledUp: boolean;
  };
  achievements: Achievement[];
  message: string;
  deckName?: string;
  onContinue: () => void;
  onStudyAgain: () => void;
}

// Animated counter component
function AnimatedCounter({
  value,
  duration = 1000,
  prefix = "",
  suffix = "",
  className = "",
}: {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const startValue = 0;

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(startValue + (value - startValue) * easeProgress));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return (
    <span className={className}>
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  );
}

// XP breakdown item with fly-in animation
function XPItem({
  label,
  value,
  delay,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  delay: number;
  icon: React.ElementType;
  color: string;
}) {
  if (value <= 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3, type: "spring" }}
      className="flex items-center justify-between py-2"
    >
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-zinc-400 text-sm">{label}</span>
      </div>
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: delay + 0.2, type: "spring" }}
        className={`font-bold ${color}`}
      >
        +{value}
      </motion.span>
    </motion.div>
  );
}

export function SessionSummary({
  session,
  xp,
  stats,
  level,
  achievements,
  message,
  deckName,
  onContinue,
  onStudyAgain,
}: SessionSummaryProps) {
  const [phase, setPhase] = useState<"stats" | "xp" | "achievements" | "done">("stats");
  const [showConfetti, setShowConfetti] = useState(false);

  // Trigger confetti for special moments
  useEffect(() => {
    if (phase === "xp" && xp.total > 0) {
      const timer = setTimeout(() => {
        createConfetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ["#10b981", "#06b6d4", "#8b5cf6"],
        });
      }, 800);
      return () => clearTimeout(timer);
    }

    if (phase === "achievements" && achievements.length > 0) {
      createConfetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.5 },
        colors: ["#fbbf24", "#f97316", "#ef4444"],
      });
    }

    if (level.leveledUp && phase === "xp") {
      setTimeout(() => {
        createConfetti({
          particleCount: 150,
          spread: 120,
          origin: { y: 0.4 },
          colors: ["#8b5cf6", "#a855f7", "#d946ef"],
        });
      }, 1200);
    }
  }, [phase, xp.total, achievements.length, level.leveledUp]);

  // Auto-advance phases
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    if (phase === "stats") {
      timers.push(setTimeout(() => setPhase("xp"), 1500));
    } else if (phase === "xp") {
      const delay = level.leveledUp ? 3500 : 2500;
      timers.push(setTimeout(() => setPhase(achievements.length > 0 ? "achievements" : "done"), delay));
    } else if (phase === "achievements") {
      timers.push(setTimeout(() => setPhase("done"), 2000));
    }

    return () => timers.forEach(clearTimeout);
  }, [phase, achievements.length, level.leveledUp]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        {/* Trophy Header */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-100">Session Complete!</h1>
          {deckName && (
            <p className="text-zinc-500 mt-1">
              Finished &ldquo;{deckName}&rdquo;
            </p>
          )}
        </motion.div>

        {/* Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 mb-4"
        >
          <div className="grid grid-cols-2 gap-4">
            {/* Cards Reviewed */}
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400">
                <AnimatedCounter value={session.cardsReviewed} />
              </div>
              <div className="text-xs text-zinc-500">Cards Reviewed</div>
            </div>

            {/* Accuracy */}
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-400">
                <AnimatedCounter value={Math.round(session.accuracy)} suffix="%" />
              </div>
              <div className="text-xs text-zinc-500">Accuracy</div>
            </div>

            {/* Best Combo */}
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400">
                <AnimatedCounter value={session.bestCombo} />
              </div>
              <div className="text-xs text-zinc-500">Best Combo</div>
            </div>

            {/* Time */}
            <div className="text-center">
              <div className="text-3xl font-bold text-violet-400">
                {formatTime(session.totalDurationMs)}
              </div>
              <div className="text-xs text-zinc-500">Total Time</div>
            </div>
          </div>
        </motion.div>

        {/* XP Breakdown */}
        <AnimatePresence mode="wait">
          {(phase === "xp" || phase === "achievements" || phase === "done") && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-violet-900/30 to-cyan-900/30 border border-violet-800/30 rounded-2xl p-6 mb-4"
            >
              {/* Total XP */}
              <div className="text-center mb-4">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                  className="inline-flex items-center gap-2"
                >
                  <Sparkles className="w-6 h-6 text-violet-400" />
                  <span className="text-4xl font-bold text-violet-400">
                    +<AnimatedCounter value={xp.total} duration={1200} />
                  </span>
                  <span className="text-xl text-violet-400/60">XP</span>
                </motion.div>
              </div>

              {/* XP Breakdown Items */}
              <div className="space-y-1 border-t border-zinc-800 pt-3">
                <XPItem label="Base Reviews" value={xp.breakdown.baseXP} delay={0.4} icon={Target} color="text-zinc-400" />
                <XPItem label="New Cards" value={xp.breakdown.newCardXP} delay={0.5} icon={Star} color="text-blue-400" />
                <XPItem label="Speed Bonus" value={xp.breakdown.speedXP} delay={0.6} icon={Zap} color="text-yellow-400" />
                <XPItem label="Combo Bonus" value={xp.breakdown.comboXP} delay={0.7} icon={TrendingUp} color="text-orange-400" />
                <XPItem label="Difficulty Bonus" value={xp.breakdown.difficultyXP} delay={0.8} icon={Target} color="text-red-400" />
                <XPItem label="Accuracy Bonus" value={xp.breakdown.accuracyBonus} delay={0.9} icon={Target} color="text-emerald-400" />
                <XPItem label="Streak Bonus" value={xp.breakdown.streakBonus} delay={1.0} icon={Flame} color="text-orange-500" />
              </div>

              {/* Level Progress */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="mt-4 pt-4 border-t border-zinc-800"
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-zinc-500">Level {level.current}</span>
                  <span className="text-zinc-500">
                    {level.xpProgress.toLocaleString()} / {level.xpNeeded.toLocaleString()} XP
                  </span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${level.progress * 100}%` }}
                    transition={{ delay: 1.4, duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-violet-500 to-cyan-500"
                  />
                </div>
                {level.leveledUp && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.6 }}
                    className="mt-3 text-center"
                  >
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-500/20 rounded-full">
                      <ChevronUp className="w-4 h-4 text-violet-400" />
                      <span className="text-sm font-bold text-violet-400">Level Up!</span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Streak Widget */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="flex items-center justify-center gap-6 mb-6"
        >
          <div className="flex items-center gap-2">
            <Flame
              className={`w-5 h-5 ${
                stats.streakIncreased ? "text-orange-400" : "text-orange-400/50"
              }`}
            />
            <span className="text-lg font-bold text-zinc-100">{stats.streak}</span>
            <span className="text-sm text-zinc-500">day streak</span>
            {stats.streakIncreased && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full"
              >
                +1
              </motion.span>
            )}
          </div>

          <div className="h-6 w-px bg-zinc-800" />

          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" />
            <span className="text-sm text-zinc-400">
              {stats.dailyXP}/{stats.dailyGoal} XP today
            </span>
          </div>
        </motion.div>

        {/* Achievements */}
        <AnimatePresence>
          {phase === "achievements" && achievements.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6"
            >
              <h3 className="text-sm font-semibold text-zinc-400 mb-3 text-center">
                New Achievements!
              </h3>
              <div className="space-y-2">
                {achievements.map((achievement, i) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.2 }}
                    className={`
                      p-3 rounded-xl border
                      ${achievement.rarity === "legendary"
                        ? "bg-amber-900/20 border-amber-500/30"
                        : achievement.rarity === "epic"
                        ? "bg-violet-900/20 border-violet-500/30"
                        : achievement.rarity === "rare"
                        ? "bg-blue-900/20 border-blue-500/30"
                        : "bg-zinc-900/50 border-zinc-800"
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`
                          w-10 h-10 rounded-lg flex items-center justify-center
                          ${achievement.rarity === "legendary"
                            ? "bg-amber-500/20"
                            : achievement.rarity === "epic"
                            ? "bg-violet-500/20"
                            : achievement.rarity === "rare"
                            ? "bg-blue-500/20"
                            : "bg-zinc-800"
                          }
                        `}
                      >
                        <Star
                          className={`w-5 h-5 ${
                            achievement.rarity === "legendary"
                              ? "text-amber-400"
                              : achievement.rarity === "epic"
                              ? "text-violet-400"
                              : achievement.rarity === "rare"
                              ? "text-blue-400"
                              : "text-zinc-400"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-zinc-100 text-sm">
                          {achievement.name}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {achievement.description}
                        </div>
                      </div>
                      <div className="text-sm font-bold text-violet-400">
                        +{achievement.xpReward}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Motivational Message */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="text-center text-sm text-zinc-500 mb-6"
        >
          {message}
        </motion.p>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8 }}
          className="flex flex-col gap-3"
        >
          <Button
            variant="primary"
            size="lg"
            icon={<ArrowRight className="w-5 h-5" />}
            iconPosition="right"
            onClick={onContinue}
          >
            Continue
          </Button>
          <Button
            variant="ghost"
            size="lg"
            icon={<RotateCcw className="w-4 h-4" />}
            onClick={onStudyAgain}
            className="text-zinc-500"
          >
            Study Again
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
