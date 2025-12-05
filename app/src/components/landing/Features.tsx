"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Wand2,
  Brain,
  Mic,
  Users,
  Image,
  BarChart3,
  Smartphone,
  Cloud,
} from "lucide-react";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  className?: string;
  children?: React.ReactNode;
  delay?: number;
}

function FeatureCard({
  title,
  description,
  icon,
  gradient,
  className = "",
  children,
  delay = 0,
}: FeatureCardProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className={`group relative rounded-2xl border border-[rgba(148,163,184,0.08)] bg-[#0f1115] overflow-hidden ${className}`}
    >
      {/* Gradient overlay on hover */}
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${gradient}`}
      />

      {/* Content */}
      <div className="relative z-10 p-6 h-full flex flex-col">
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-[#161a1f] border border-[rgba(148,163,184,0.08)] flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-white/10 transition-all duration-300">
          {icon}
        </div>

        {/* Text */}
        <h3 className="font-display text-xl font-semibold text-slate-100 mb-2">
          {title}
        </h3>
        <p className="text-slate-400 text-sm leading-relaxed flex-grow">
          {description}
        </p>

        {/* Optional visual content */}
        {children && <div className="mt-4">{children}</div>}
      </div>

      {/* Border glow on hover */}
      <div className="absolute inset-0 rounded-2xl border border-transparent group-hover:border-white/5 transition-colors duration-500 pointer-events-none" />
    </motion.div>
  );
}

export function Features() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section id="features" ref={sectionRef} className="relative py-32">
      {/* Background */}
      <div className="absolute inset-0 bg-[#08090a]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-cyan-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-cyan-400 text-sm font-medium tracking-wider uppercase">
            Features
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-slate-100 mt-4">
            Everything you need to
            <span className="text-gradient"> master anything</span>
          </h2>
          <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
            Powerful features that make studying effortless, not a chore.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[200px]">
          {/* AI Magic Import - Large */}
          <FeatureCard
            title="AI Magic Import"
            description="Transform any content into intelligent flashcards. Drop a PDF, paste a YouTube URL, or snap a photo of your textbook."
            icon={<Wand2 className="w-6 h-6 text-cyan-400" />}
            gradient="bg-gradient-to-br from-cyan-500/10 to-transparent"
            className="md:col-span-2 md:row-span-2"
            delay={0.1}
          >
            {/* Visual demo */}
            <div className="mt-auto flex flex-wrap gap-2">
              {["PDF", "YouTube", "Web", "Images", "Audio"].map((type) => (
                <span
                  key={type}
                  className="px-3 py-1.5 rounded-lg bg-[#161a1f] border border-[rgba(148,163,184,0.08)] text-xs text-slate-400"
                >
                  {type}
                </span>
              ))}
            </div>
          </FeatureCard>

          {/* FSRS Algorithm */}
          <FeatureCard
            title="FSRS Native"
            description="The most advanced spaced repetition algorithm, optimizing your retention automatically."
            icon={<Brain className="w-6 h-6 text-violet-400" />}
            gradient="bg-gradient-to-br from-violet-500/10 to-transparent"
            delay={0.2}
          >
            <div className="flex items-end gap-1 h-12 mt-2">
              {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                <motion.div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-violet-500/50 to-violet-400/80 rounded-t"
                  initial={{ height: 0 }}
                  animate={isInView ? { height: `${h}%` } : {}}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                />
              ))}
            </div>
          </FeatureCard>

          {/* Voice Mode */}
          <FeatureCard
            title="Voice Mode"
            description="Study hands-free. Listen and respond with voice while commuting."
            icon={<Mic className="w-6 h-6 text-green-400" />}
            gradient="bg-gradient-to-br from-green-500/10 to-transparent"
            delay={0.3}
          >
            <div className="flex items-center gap-1 h-8 mt-2">
              {[0.3, 0.5, 0.8, 0.4, 1, 0.6, 0.9, 0.3, 0.7, 0.5, 0.4, 0.8].map((h, i) => (
                <motion.div
                  key={i}
                  className="flex-1 bg-green-400/60 rounded-full"
                  animate={{
                    height: isInView ? `${h * 100}%` : "20%",
                    opacity: isInView ? [0.4, 1, 0.4] : 0.4,
                  }}
                  transition={{
                    height: { duration: 0.3, delay: i * 0.05 },
                    opacity: { duration: 1.5, repeat: Infinity, delay: i * 0.1 },
                  }}
                  style={{ height: "20%" }}
                />
              ))}
            </div>
          </FeatureCard>

          {/* Image Occlusion - Wide */}
          <FeatureCard
            title="Smart Image Occlusion"
            description="AI detects labels and creates occlusion masks automatically. Perfect for anatomy, diagrams, and maps."
            icon={<Image className="w-6 h-6 text-orange-400" />}
            gradient="bg-gradient-to-br from-orange-500/10 to-transparent"
            className="md:col-span-2"
            delay={0.4}
          >
            <div className="relative h-20 bg-[#161a1f] rounded-lg mt-2 overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center gap-8 text-xs text-slate-500">
                <span>Heart</span>
                <motion.span
                  className="px-4 py-1 bg-orange-500 rounded text-[#08090a] font-medium"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ?
                </motion.span>
                <span>Lungs</span>
              </div>
            </div>
          </FeatureCard>

          {/* Collaboration */}
          <FeatureCard
            title="Real-time Collab"
            description="Study together with shared decks that sync instantly."
            icon={<Users className="w-6 h-6 text-blue-400" />}
            gradient="bg-gradient-to-br from-blue-500/10 to-transparent"
            delay={0.5}
          >
            <div className="flex -space-x-2 mt-2">
              {["A", "B", "C", "+5"].map((letter, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-2 border-[#0f1115] flex items-center justify-center text-xs text-blue-400"
                >
                  {letter}
                </div>
              ))}
            </div>
          </FeatureCard>

          {/* Analytics */}
          <FeatureCard
            title="Deep Analytics"
            description="Track your progress with beautiful retention graphs and insights."
            icon={<BarChart3 className="w-6 h-6 text-pink-400" />}
            gradient="bg-gradient-to-br from-pink-500/10 to-transparent"
            delay={0.6}
          >
            <div className="text-2xl font-display font-bold text-pink-400 mt-2">
              94%
              <span className="text-xs text-slate-500 font-normal ml-2">
                retention
              </span>
            </div>
          </FeatureCard>

          {/* Cross Platform - Wide */}
          <FeatureCard
            title="Study Anywhere"
            description="Seamless sync across all your devices. Web, iOS, Android—pick up where you left off."
            icon={<Smartphone className="w-6 h-6 text-cyan-400" />}
            gradient="bg-gradient-to-br from-cyan-500/10 to-transparent"
            className="md:col-span-2"
            delay={0.7}
          >
            <div className="flex items-center gap-4 mt-2">
              {[
                { icon: "💻", label: "Web" },
                { icon: "📱", label: "iOS" },
                { icon: "📱", label: "Android" },
              ].map((platform) => (
                <div
                  key={platform.label}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#161a1f] border border-[rgba(148,163,184,0.08)]"
                >
                  <span>{platform.icon}</span>
                  <span className="text-xs text-slate-400">{platform.label}</span>
                </div>
              ))}
              <div className="flex items-center gap-1 ml-auto">
                <Cloud className="w-4 h-4 text-green-400" />
                <span className="text-xs text-green-400">Synced</span>
              </div>
            </div>
          </FeatureCard>
        </div>
      </div>
    </section>
  );
}
