"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Check, Sparkles, Zap, Crown } from "lucide-react";
import { Button } from "../ui/Button";

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
    description: "Pay once, own forever. For power users who hate subscriptions.",
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
  },
];

export function Pricing() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="pricing" ref={ref} className="relative py-32">
      {/* Background */}
      <div className="absolute inset-0 bg-[#08090a]">
        <div className="absolute top-1/2 left-1/4 w-[600px] h-[400px] bg-cyan-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[300px] bg-violet-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-cyan-400 text-sm font-medium tracking-wider uppercase">
            Pricing
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-slate-100 mt-4">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
            Start free. Upgrade when you&apos;re ready. No credit card required.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
              className={`relative rounded-2xl border ${
                tier.popular
                  ? "border-cyan-500/30"
                  : "border-[rgba(148,163,184,0.08)]"
              } bg-[#0f1115] overflow-hidden`}
            >
              {/* Popular Badge */}
              {tier.popular && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-cyan-500 to-blue-500 text-[#08090a] text-xs font-semibold text-center py-1">
                  Most Popular
                </div>
              )}

              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${tier.gradient} opacity-50`} />

              {/* Content */}
              <div className={`relative z-10 p-8 ${tier.popular ? "pt-10" : ""}`}>
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      tier.popular
                        ? "bg-cyan-500/20 text-cyan-400"
                        : tier.name === "Lifetime"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-slate-500/20 text-slate-400"
                    }`}
                  >
                    {tier.icon}
                  </div>
                  <span className="font-display text-xl font-semibold text-slate-100">
                    {tier.name}
                  </span>
                </div>

                {/* Price */}
                <div className="mb-4">
                  <span className="font-display text-5xl font-bold text-slate-100">
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span className="text-slate-500 ml-2">{tier.period}</span>
                  )}
                </div>

                {/* Description */}
                <p className="text-slate-400 text-sm mb-6">{tier.description}</p>

                {/* CTA Button */}
                <Button
                  variant={tier.popular ? "primary" : "secondary"}
                  className="w-full mb-6"
                >
                  {tier.cta}
                </Button>

                {/* Features */}
                <ul className="space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check
                        className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                          tier.popular ? "text-cyan-400" : "text-slate-500"
                        }`}
                      />
                      <span className="text-sm text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Glow effect for popular */}
              {tier.popular && (
                <div className="absolute inset-0 rounded-2xl shadow-[0_0_60px_rgba(34,211,238,0.15)] pointer-events-none" />
              )}
            </motion.div>
          ))}
        </div>

        {/* Bottom Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-slate-500 text-sm">
            All plans include a 14-day free trial of Pro features.{" "}
            <a href="#" className="text-cyan-400 hover:text-cyan-300 transition-colors">
              Learn more →
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
