"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Star, Quote } from "lucide-react";

const logos = [
  { name: "Harvard", abbr: "H" },
  { name: "Stanford", abbr: "S" },
  { name: "MIT", abbr: "MIT" },
  { name: "Oxford", abbr: "Ox" },
  { name: "Yale", abbr: "Y" },
  { name: "Berkeley", abbr: "Cal" },
];

const testimonials = [
  {
    quote: "I replaced my old flashcards workflow after 3 years. The AI card generation alone saves me 5+ hours a week. Best decision for my MCAT prep.",
    author: "Sarah M.",
    role: "Medical Student",
    rating: 5,
  },
  {
    quote: "Finally, spaced repetition that doesn't require a PhD to set up. I was studying within 2 minutes of signing up.",
    author: "James K.",
    role: "Law Student",
    rating: 5,
  },
  {
    quote: "The voice mode is a game-changer for my commute. I've doubled my study time without even trying.",
    author: "Emily R.",
    role: "Nursing Student",
    rating: 5,
  },
];

const stats = [
  { value: "2.5M+", label: "Cards Created" },
  { value: "50K+", label: "Active Learners" },
  { value: "89%", label: "Avg. Retention" },
  { value: "4.9/5", label: "User Rating" },
];

export function SocialProof() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative py-16 sm:py-20 lg:py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#08090a]">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        {/* Logo Cloud */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <p className="text-xs sm:text-sm text-slate-500 uppercase tracking-wider mb-6 sm:mb-8">
            Trusted by students at top universities
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 lg:gap-12">
            {logos.map((logo, i) => (
              <motion.div
                key={logo.name}
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="flex items-center gap-2 opacity-40 hover:opacity-70 transition-opacity"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-slate-800/50 border border-slate-700/50 flex items-center justify-center">
                  <span className="text-xs sm:text-sm font-bold text-slate-400">{logo.abbr}</span>
                </div>
                <span className="text-sm sm:text-base text-slate-500 font-medium hidden sm:block">{logo.name}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16"
        >
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="text-center p-4 sm:p-6 rounded-xl bg-[#0f1115] border border-[rgba(148,163,184,0.08)]"
            >
              <motion.div
                initial={{ scale: 0.5 }}
                animate={isInView ? { scale: 1 } : {}}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient"
              >
                {stat.value}
              </motion.div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h3 className="text-center text-lg sm:text-xl font-semibold text-slate-300 mb-6 sm:mb-8">
            What our learners say
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
                className="relative p-5 sm:p-6 rounded-xl bg-[#0f1115] border border-[rgba(148,163,184,0.08)] hover:border-cyan-500/20 transition-colors"
              >
                <Quote className="absolute top-4 right-4 w-6 h-6 text-cyan-500/20" />

                {/* Rating */}
                <div className="flex gap-0.5 mb-3">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-4">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center border border-cyan-500/30">
                    <span className="text-xs sm:text-sm font-medium text-cyan-400">
                      {testimonial.author.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{testimonial.author}</p>
                    <p className="text-xs text-slate-500">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
