"use client";

import { motion } from "framer-motion";
import { XCircle, ArrowLeft, HelpCircle, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

export default function BillingCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#08090a] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 text-center">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-zinc-800 flex items-center justify-center"
          >
            <XCircle className="w-10 h-10 text-zinc-400" />
          </motion.div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-zinc-100 mb-2">
            Payment Cancelled
          </h1>

          {/* Description */}
          <p className="text-zinc-400 mb-6">
            No worries! Your payment was cancelled and you haven&apos;t been charged.
            You can continue using Studek with your current plan.
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              variant="primary"
              className="w-full"
              onClick={() => router.push("/settings")}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Back to Settings
            </Button>

            <Button
              variant="secondary"
              className="w-full"
              onClick={() => router.push("/dashboard")}
            >
              Go to Dashboard
            </Button>
          </div>

          {/* Help Section */}
          <div className="mt-8 pt-6 border-t border-zinc-800">
            <p className="text-sm text-zinc-500 mb-3">
              Have questions about our plans?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => router.push("/settings")}
                className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-cyan-400 transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                View Plans
              </button>
              <a
                href="mailto:hello@studek.com"
                className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-cyan-400 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
