"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import { ChevronDown, MessageCircle } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "Can I import my existing decks?",
    answer:
      "Yes! Studek supports .apkg imports, including cards and media. You can bring your study library over in minutes and keep moving without starting from scratch.",
  },
  {
    question: "Does it work offline?",
    answer:
      "Absolutely. Studek is designed with an offline-first architecture. All your cards sync to your device, so you can study anywhere—on a plane, subway, or in areas with poor connectivity. Changes sync automatically when you're back online.",
  },
  {
    question: "Is my data private and secure?",
    answer:
      "Your privacy is our priority. All data is encrypted in transit and at rest. We never sell your data or use it for advertising. You can export all your data anytime in standard formats, and we offer complete account deletion.",
  },
  {
    question: "How does the AI card generation work?",
    answer:
      "Our AI analyzes your content—PDFs, videos, or web pages—and extracts key concepts, definitions, and relationships. It then generates high-quality question-answer pairs optimized for retention. You can review and edit all generated cards before adding them to your deck.",
  },
  {
    question: "What makes FSRS better than SM-2?",
    answer:
      "FSRS (Free Spaced Repetition Scheduler) adapts to your memory patterns and optimizes review intervals based on performance. In practice, it can improve retention while reducing unnecessary reviews compared to older schedulers.",
  },
  {
    question: "Can I study with friends or classmates?",
    answer:
      "Yes! Create shared decks that sync in real-time with your study group. Everyone's edits and additions appear instantly. Perfect for study groups, classes, or collaborative learning projects.",
  },
  {
    question: "What's the difference between Free and Pro?",
    answer:
      "Free gives you unlimited flashcards, FSRS spaced repetition, basic AI generation (50 cards/month), and full cross-platform sync. Pro unlocks unlimited AI generation, voice study mode, AI image occlusion, advanced analytics, and priority support.",
  },
  {
    question: "Do you offer student discounts?",
    answer:
      "Yes! Students with a valid .edu email get 50% off Pro plans. Just sign up with your school email and the discount applies automatically.",
  },
];

function FAQAccordion({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-[rgba(148,163,184,0.08)] last:border-0">
      <button
        onClick={onToggle}
        className="w-full py-4 sm:py-5 lg:py-6 flex items-center justify-between text-left group"
      >
        <span className="font-medium text-sm sm:text-base text-slate-200 group-hover:text-slate-100 transition-colors pr-3 sm:pr-4">
          {item.question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown
            className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${
              isOpen ? "text-cyan-400" : "text-slate-500"
            }`}
          />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-4 sm:pb-5 lg:pb-6 text-xs sm:text-sm lg:text-base text-slate-400 leading-relaxed">{item.answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FAQ() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" ref={ref} className="relative py-16 sm:py-24 lg:py-32">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0a0b0d]">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-12 lg:mb-16"
        >
          <span className="text-cyan-400 text-xs sm:text-sm font-medium tracking-wider uppercase">
            FAQ
          </span>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-100 mt-3 sm:mt-4">
            Questions? We&apos;ve got answers.
          </h2>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base lg:text-lg text-slate-400">
            Everything you need to know about Studek.
          </p>
        </motion.div>

        {/* FAQ List */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="rounded-xl sm:rounded-2xl border border-[rgba(148,163,184,0.08)] bg-[#0f1115] px-4 sm:px-6 lg:px-8"
        >
          {faqData.map((item, index) => (
            <FAQAccordion
              key={index}
              item={item}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </motion.div>

        {/* Still have questions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 sm:mt-10 lg:mt-12 text-center"
        >
          <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-5 lg:px-6 py-3 sm:py-3.5 lg:py-4 rounded-xl sm:rounded-2xl bg-[#0f1115] border border-[rgba(148,163,184,0.08)]">
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
            <span className="text-xs sm:text-sm text-slate-400">
              Still have questions?{" "}
              <a href="#" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                Chat with us
              </a>
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
