"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/stores/auth";

export default function BillingSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser, user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    const verifyAndRefresh = async () => {
      // Refresh user data to get updated plan
      await refreshUser();
      setIsLoading(false);
    };

    // Give Stripe webhook a moment to process
    const timer = setTimeout(verifyAndRefresh, 1500);
    return () => clearTimeout(timer);
  }, [refreshUser]);

  const planName = user?.plan?.name || "Premium";

  return (
    <div className="min-h-screen bg-[#08090a] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 text-center">
          {isLoading ? (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-cyan-500/10 flex items-center justify-center"
              >
                <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
              </motion.div>
              <h1 className="text-2xl font-bold text-zinc-100 mb-2">
                Processing Payment...
              </h1>
              <p className="text-zinc-400">
                Please wait while we confirm your subscription.
              </p>
            </>
          ) : (
            <>
              {/* Success Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 flex items-center justify-center"
              >
                <CheckCircle className="w-10 h-10 text-emerald-400" />
              </motion.div>

              {/* Confetti Effect */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-center gap-2 mb-4"
              >
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <span className="text-sm font-medium text-cyan-400">
                  Welcome to {planName}!
                </span>
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </motion.div>

              {/* Title */}
              <h1 className="text-2xl font-bold text-zinc-100 mb-2">
                Payment Successful!
              </h1>

              {/* Description */}
              <p className="text-zinc-400 mb-6">
                Thank you for upgrading! Your {planName} subscription is now active.
                You now have access to all {planName.toLowerCase()} features.
              </p>

              {/* Features Unlocked */}
              <div className="bg-zinc-800/50 rounded-xl p-4 mb-6">
                <p className="text-sm font-medium text-zinc-300 mb-3">
                  Features Unlocked:
                </p>
                <ul className="text-sm text-zinc-400 space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    Unlimited flashcard decks
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    Unlimited study sessions
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    AI-generated flashcards
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    Priority support
                  </li>
                </ul>
              </div>

              {/* Session ID (for reference) */}
              {sessionId && (
                <p className="text-xs text-zinc-600 mb-6">
                  Reference: {sessionId.slice(0, 20)}...
                </p>
              )}

              {/* Actions */}
              <div className="space-y-3">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => router.push("/dashboard")}
                  icon={<ArrowRight className="w-4 h-4" />}
                  iconPosition="right"
                >
                  Start Studying
                </Button>

                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => router.push("/settings")}
                >
                  Manage Subscription
                </Button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
