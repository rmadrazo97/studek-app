"use client";

import { useEffect, useState, Suspense } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader2, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided");
      return;
    }

    async function verifyEmail() {
      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully!");
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed");
        }
      } catch {
        setStatus("error");
        setMessage("An error occurred during verification");
      }
    }

    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-12">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[var(--gradient-hero)]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.15),transparent_70%)]" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(167,139,250,0.1),transparent_70%)]" />

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
          <div className="text-center">
            {status === "loading" && (
              <>
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-cyan-500/10 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                </div>
                <h1 className="font-display text-2xl font-bold text-slate-100 mb-2">
                  Verifying your email...
                </h1>
                <p className="text-slate-400">
                  Please wait while we verify your email address
                </p>
              </>
            )}

            {status === "success" && (
              <>
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/10 flex items-center justify-center"
                >
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </motion.div>
                <h1 className="font-display text-2xl font-bold text-slate-100 mb-2">
                  Email Verified!
                </h1>
                <p className="text-slate-400 mb-8">
                  {message}
                </p>
                <Link href="/dashboard">
                  <Button
                    variant="primary"
                    size="lg"
                    icon={<ArrowRight className="w-5 h-5" />}
                    iconPosition="right"
                    className="w-full"
                  >
                    Go to Dashboard
                  </Button>
                </Link>
              </>
            )}

            {status === "error" && (
              <>
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center"
                >
                  <XCircle className="w-8 h-8 text-red-400" />
                </motion.div>
                <h1 className="font-display text-2xl font-bold text-slate-100 mb-2">
                  Verification Failed
                </h1>
                <p className="text-slate-400 mb-8">
                  {message}
                </p>
                <div className="space-y-3">
                  <Link href="/login">
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full"
                    >
                      Go to Login
                    </Button>
                  </Link>
                  <p className="text-sm text-slate-500">
                    Need a new verification link?{" "}
                    <Link
                      href="/login"
                      className="text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      Sign in and request one
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
