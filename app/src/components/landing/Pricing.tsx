"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Check, Sparkles, Zap, Crown, Shield, Clock, RefreshCcw } from "lucide-react";
import { Button } from "../ui/Button";
import Link from "next/link";

interface PricingTier {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  popular?: boolean;
  icon: React.ReactNode;
  gradient: string;
  savings?: string;
}

const tiers: PricingTier[] = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Everything you need to start studying smarter.",
    features: [
      "Unlimited flashcards",
      "FSRS spaced repetition",
      "Basic AI generation (50/month)",
      "Cross-platform sync",
      "Anki import",
      "Community decks",
    ],
    cta: "Get Started",
    icon: <Sparkles className="w-5 h-5" />,
    gradient: "from-slate-500/10 to-transparent",
  },
  {
    name: "Pro",
    price: "$9",
    period: "/month",
    description: "Unlock unlimited AI and advanced features.",
    features: [
      "Everything in Free",
      "Unlimited AI generation",
      "Voice study mode",
      "AI image occlusion",
      "Priority support",
      "Advanced analytics",
      "Custom themes",
    ],
    cta: "Start Free Trial",
    popular: true,
    icon: <Zap className="w-5 h-5" />,
    gradient: "from-cyan-500/10 via-blue-500/10 to-violet-500/10",
  },
  {
    name: "Lifetime",
    price: "$149",
    period: "once",
    description: "Pay once, own forever. Best value for power users.",
    features: [
      "Everything in Pro",
      "Lifetime updates",
      "Founder badge",
      "Early access features",
      "Direct support channel",
      "Export all data anytime",
    ],
    cta: "Get Lifetime Access",
    icon: <Crown className="w-5 h-5" />,
    gradient: "from-yellow-500/10 to-orange-500/10",
    savings: "Save $58/year",
  },
];

const trustBadges = [
  { icon: Shield, text: "256-bit encryption" },
  { icon: RefreshCcw, text: "30-day money back" },
  { icon: Clock, text: "Cancel anytime" },
];

export function Pricing() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="pricing" ref={ref} className="relative py-16 sm:py-24 lg:py-32">
      {/* Background */}
      <div className="absolute inset-0 bg-[#08090a]">
        <div className="absolute top-1/2 left-1/4 w-[400px] sm:w-[500px] lg:w-[600px] h-[300px] sm:h-[350px] lg:h-[400px] bg-cyan-500/5 rounded-full blur-[100px] sm:blur-[120px] lg:blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[350px] sm:w-[400px] lg:w-[500px] h-[200px] sm:h-[250px] lg:h-[300px] bg-violet-500/5 rounded-full blur-[80px] sm:blur-[100px] lg:blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-12 lg:mb-16"
        >
          <span className="text-cyan-400 text-xs sm:text-sm font-medium tracking-wider uppercase">
            Pricing
          </span>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-100 mt-3 sm:mt-4">
            Simple, transparent pricing
          </h2>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base lg:text-lg text-slate-400 max-w-2xl mx-auto">
            Start free. Upgrade when you&apos;re ready. No credit card required.
          </p>

          {/* Trust badges */}
          <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6 lg:gap-8">
            {trustBadges.map((badge, i) => (
              <motion.div
                key={badge.text}
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-400"
              >
                <badge.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400" />
                <span>{badge.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
              className={`relative rounded-xl sm:rounded-2xl border ${
                tier.popular
                  ? "border-cyan-500/30"
                  : "border-[rgba(148,163,184,0.08)]"
              } bg-[#0f1115] overflow-hidden`}
            >
              {/* Popular Badge */}
              {tier.popular && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-cyan-500 to-blue-500 text-[#08090a] text-[10px] sm:text-xs font-semibold text-center py-1">
                  Most Popular
                </div>
              )}

              {/* Savings Badge */}
              {tier.savings && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-yellow-500 to-orange-500 text-[#08090a] text-[10px] sm:text-xs font-semibold text-center py-1">
                  {tier.savings}
                </div>
              )}

              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${tier.gradient} opacity-50`} />

              {/* Content */}
              <div className={`relative z-10 p-5 sm:p-6 lg:p-8 ${tier.popular || tier.savings ? "pt-8 sm:pt-10" : ""}`}>
                {/* Header */}
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-lg sm:rounded-xl flex items-center justify-center ${
                      tier.popular
                        ? "bg-cyan-500/20 text-cyan-400"
                        : tier.name === "Lifetime"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-slate-500/20 text-slate-400"
                    }`}
                  >
                    {tier.icon}
                  </div>
                  <span className="font-display text-lg sm:text-xl font-semibold text-slate-100">
                    {tier.name}
                  </span>
                </div>

                {/* Price */}
                <div className="mb-3 sm:mb-4">
                  <span className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-100">
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span className="text-slate-500 text-sm sm:text-base ml-1.5 sm:ml-2">{tier.period}</span>
                  )}
                </div>

                {/* Description */}
                <p className="text-slate-400 text-xs sm:text-sm mb-4 sm:mb-6">{tier.description}</p>

                {/* CTA Button */}
                <Link href="/register" className="block">
                  <Button
                    variant={tier.popular ? "primary" : "secondary"}
                    className="w-full text-xs sm:text-sm mb-4 sm:mb-6"
                  >
                    {tier.cta}
                  </Button>
                </Link>

                {/* Features */}
                <ul className="space-y-2 sm:space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 sm:gap-3">
                      <Check
                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5 ${
                          tier.popular ? "text-cyan-400" : "text-slate-500"
                        }`}
                      />
                      <span className="text-xs sm:text-sm text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Glow effect for popular */}
              {tier.popular && (
                <div className="absolute inset-0 rounded-xl sm:rounded-2xl shadow-[0_0_40px_rgba(34,211,238,0.1)] sm:shadow-[0_0_60px_rgba(34,211,238,0.15)] pointer-events-none" />
              )}
            </motion.div>
          ))}
        </div>

        {/* Bottom Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-8 sm:mt-10 lg:mt-12 text-center"
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-4 p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-[#0f1115] border border-[rgba(148,163,184,0.08)]">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
              <span className="text-sm sm:text-base text-slate-300 font-medium">
                All plans include 14-day free trial
              </span>
            </div>
            <span className="hidden sm:block text-slate-600">|</span>
            <a href="#" className="text-cyan-400 hover:text-cyan-300 transition-colors text-xs sm:text-sm">
              Compare all features →
            </a>
          </div>

          {/* Student discount */}
          <p className="mt-4 sm:mt-6 text-xs sm:text-sm text-slate-500">
            Student? Get{" "}
            <span className="text-cyan-400 font-medium">50% off</span>{" "}
            with your .edu email
          </p>
        </motion.div>
      </div>
    </section>
  );
}
