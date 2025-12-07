"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Sparkles, ArrowRight, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Email is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      // Always show success to prevent email enumeration
      setIsSuccess(true);
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-12">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[var(--gradient-hero)]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(234,179,8,0.15),transparent_70%)]" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.1),transparent_70%)]" />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8 group">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.4)]"
          >
            <Sparkles className="w-6 h-6 text-[#08090a]" />
          </motion.div>
          <span className="font-display text-2xl font-bold text-slate-100">
            Studek
          </span>
        </Link>

        {/* Card */}
        <div className="glass rounded-2xl p-8">
          {!isSuccess ? (
            <>
              <div className="text-center mb-8">
                <h1 className="font-display text-3xl font-bold text-slate-100 mb-2">
                  Forgot password?
                </h1>
                <p className="text-slate-400">
                  No worries, we&apos;ll send you reset instructions.
                </p>
              </div>

              {/* Error message */}
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Form */}
              <form className="space-y-5" onSubmit={handleSubmit}>
                <Input
                  type="email"
                  label="Email"
                  placeholder="you@example.com"
                  icon={<Mail className="w-5 h-5" />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full !bg-gradient-to-r !from-yellow-400 !to-orange-500"
                  icon={isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                  iconPosition="right"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "Reset Password"}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/10 flex items-center justify-center"
              >
                <CheckCircle className="w-8 h-8 text-green-400" />
              </motion.div>
              <h1 className="font-display text-2xl font-bold text-slate-100 mb-2">
                Check your email
              </h1>
              <p className="text-slate-400 mb-6">
                If an account exists with <span className="text-cyan-400">{email}</span>, you&apos;ll receive a password reset link shortly.
              </p>
              <p className="text-sm text-slate-500 mb-8">
                Didn&apos;t receive the email? Check your spam folder or{" "}
                <button
                  onClick={() => {
                    setIsSuccess(false);
                    setEmail("");
                  }}
                  className="text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  try again
                </button>
              </p>
            </div>
          )}

          {/* Back to login */}
          <Link
            href="/login"
            className="mt-8 flex items-center justify-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
