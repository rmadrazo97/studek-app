"use client";

import { motion } from "framer-motion";
import { Mail, Lock, User, Sparkles, ArrowRight, GraduationCap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-12">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[var(--gradient-hero)]" />
      <div className="absolute top-0 right-1/4 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(167,139,250,0.15),transparent_70%)]" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.1),transparent_70%)]" />

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
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.4)]"
          >
            <Sparkles className="w-6 h-6 text-[#08090a]" />
          </motion.div>
          <span className="font-display text-2xl font-bold text-slate-100">
            Studek
          </span>
        </Link>

        {/* Card */}
        <div className="glass rounded-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold text-slate-100 mb-2">
              Create your account
            </h1>
            <p className="text-slate-400">
              Start your smarter learning journey today
            </p>
          </div>

          {/* Form */}
          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            <Input
              type="text"
              label="Full name"
              placeholder="John Doe"
              icon={<User className="w-5 h-5" />}
            />

            <Input
              type="email"
              label="Email"
              placeholder="you@example.com"
              icon={<Mail className="w-5 h-5" />}
            />

            <Input
              type="password"
              label="Password"
              placeholder="Create a strong password"
              icon={<Lock className="w-5 h-5" />}
            />

            <Input
              type="password"
              label="Confirm password"
              placeholder="Confirm your password"
              icon={<Lock className="w-5 h-5" />}
            />

            {/* Student discount notice */}
            <div className="flex items-start gap-3 p-4 bg-[rgba(34,211,238,0.08)] rounded-xl border border-cyan-400/20">
              <GraduationCap className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-slate-300">
                  <span className="text-cyan-400 font-medium">Student?</span> Use your .edu email for 50% off Pro!
                </p>
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 mt-1 rounded border-slate-600 bg-[#0f1115] text-cyan-400 focus:ring-cyan-400/20 focus:ring-offset-0"
              />
              <span className="text-sm text-slate-400">
                I agree to the{" "}
                <Link href="/terms" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                  Privacy Policy
                </Link>
              </span>
            </label>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              icon={<ArrowRight className="w-5 h-5" />}
              iconPosition="right"
            >
              Create Account
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[rgba(148,163,184,0.15)]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[rgba(15,17,21,0.8)] text-slate-500">
                Or sign up with
              </span>
            </div>
          </div>

          {/* Social signup */}
          <div className="grid grid-cols-2 gap-4">
            <Button variant="secondary" size="md" className="w-full">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>
            <Button variant="secondary" size="md" className="w-full">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </Button>
          </div>

          {/* Sign in link */}
          <p className="mt-8 text-center text-slate-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Features preview */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-8 grid grid-cols-3 gap-4 text-center"
        >
          {[
            { label: "AI-Powered", sublabel: "Smart flashcards" },
            { label: "Spaced Rep", sublabel: "Never forget" },
            { label: "Free Tier", sublabel: "No credit card" },
          ].map((feature, i) => (
            <div key={i} className="text-slate-400">
              <p className="text-sm font-medium text-slate-300">{feature.label}</p>
              <p className="text-xs">{feature.sublabel}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
