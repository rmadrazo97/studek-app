"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Crown, Sparkles, Zap, X, ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { getAccessToken } from "@/stores/auth";

interface PlanLimitDetails {
  code: string;
  limit: number;
  current: number;
  plan: {
    id: string;
    slug: string;
    name: string;
  };
}

interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
  limitDetails?: PlanLimitDetails;
  /** Custom title override */
  title?: string;
  /** Custom description override */
  description?: string;
}

const LIMIT_MESSAGES: Record<string, { title: string; description: string; icon: React.ReactNode }> = {
  study_session_limit: {
    title: "Session Limit Reached",
    description: "You've used all your study sessions for this deck today. Upgrade to continue learning without limits.",
    icon: <Zap className="w-6 h-6" />,
  },
  deck_limit: {
    title: "Deck Limit Reached",
    description: "You've reached the maximum number of decks on your plan. Upgrade to create unlimited decks.",
    icon: <Sparkles className="w-6 h-6" />,
  },
  ai_deck_limit: {
    title: "AI Deck Limit Reached",
    description: "You've used all your AI-generated decks. Upgrade to create more with AI.",
    icon: <Sparkles className="w-6 h-6" />,
  },
  public_deck_limit: {
    title: "Public Deck Limit Reached",
    description: "You've reached the maximum number of public decks. Upgrade to share more decks.",
    icon: <Sparkles className="w-6 h-6" />,
  },
};

const PLAN_FEATURES = {
  premium: [
    "Unlimited study sessions",
    "Unlimited decks",
    "2 AI-generated decks",
    "Unlimited public decks",
    "Priority support",
  ],
  pro: [
    "Everything in Premium",
    "Unlimited AI-generated decks",
    "Advanced analytics",
    "Early access to new features",
  ],
};

export function UpgradePrompt({
  isOpen,
  onClose,
  limitDetails,
  title: customTitle,
  description: customDescription,
}: UpgradePromptProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const limitMessage = limitDetails?.code
    ? LIMIT_MESSAGES[limitDetails.code]
    : null;

  const title = customTitle || limitMessage?.title || "Upgrade Your Plan";
  const description =
    customDescription ||
    limitMessage?.description ||
    "Unlock unlimited access to all features.";
  const icon = limitMessage?.icon || <Crown className="w-6 h-6" />;

  const handleUpgrade = async (planSlug: string) => {
    const token = getAccessToken();
    if (!token) {
      setError("Please log in to upgrade");
      return;
    }

    setIsLoading(planSlug);
    setError(null);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: planSlug }),
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Unable to start checkout");
      }

      window.location.href = data.url;
    } catch (err) {
      console.error("[Upgrade] Checkout error", err);
      setError("We couldn't start checkout. Please try again.");
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden"
          >
            {/* Header with gradient */}
            <div className="relative px-6 pt-6 pb-4">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/5 transition-colors text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 mb-4">
                {icon}
              </div>

              {/* Title & Description */}
              <h2 className="text-xl font-bold text-zinc-100">{title}</h2>
              <p className="text-zinc-400 mt-1 text-sm leading-relaxed">
                {description}
              </p>

              {/* Usage indicator */}
              {limitDetails && (
                <div className="mt-4 p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Current usage</span>
                    <span className="text-zinc-200 font-medium">
                      {limitDetails.current} / {limitDetails.limit}
                    </span>
                  </div>
                  <div className="mt-2 h-2 bg-zinc-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(100, (limitDetails.current / limitDetails.limit) * 100)}%`,
                      }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Plans */}
            <div className="px-6 pb-2 space-y-3">
              {/* Premium Plan */}
              <div className="p-4 rounded-xl bg-zinc-800/30 border border-zinc-700/50 hover:border-cyan-500/30 transition-colors group">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span className="font-semibold text-zinc-100">Premium</span>
                      <span className="px-2 py-0.5 text-xs bg-cyan-500/10 text-cyan-400 rounded-full">
                        Popular
                      </span>
                    </div>
                    <div className="mt-1 text-2xl font-bold text-zinc-100">
                      $3.99
                      <span className="text-sm font-normal text-zinc-500">/month</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUpgrade("premium")}
                    disabled={isLoading !== null}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                  >
                    {isLoading === "premium" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Upgrade
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
                <ul className="mt-3 grid grid-cols-2 gap-1 text-xs text-zinc-400">
                  {PLAN_FEATURES.premium.map((feature) => (
                    <li key={feature} className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-cyan-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pro Plan */}
              <div className="p-4 rounded-xl bg-zinc-800/30 border border-zinc-700/50 hover:border-violet-500/30 transition-colors group">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-violet-400" />
                      <span className="font-semibold text-zinc-100">Pro</span>
                    </div>
                    <div className="mt-1 text-2xl font-bold text-zinc-100">
                      $5.99
                      <span className="text-sm font-normal text-zinc-500">/month</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUpgrade("pro")}
                    disabled={isLoading !== null}
                    className="px-4 py-2 bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                  >
                    {isLoading === "pro" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Upgrade
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
                <ul className="mt-3 grid grid-cols-2 gap-1 text-xs text-zinc-400">
                  {PLAN_FEATURES.pro.map((feature) => (
                    <li key={feature} className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-violet-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mx-6 mb-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Footer */}
            <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between">
              <p className="text-xs text-zinc-500">
                Cancel anytime. Secure payments via Stripe.
              </p>
              <button
                onClick={onClose}
                className="text-sm text-zinc-400 hover:text-zinc-300 transition-colors"
              >
                Maybe later
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default UpgradePrompt;
