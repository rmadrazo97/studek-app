"use client";

import { useEffect, useState, Suspense } from "react";
import { motion } from "framer-motion";
import { Lock, Sparkles, ArrowRight, Loader2, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"validating" | "valid" | "invalid" | "success">("validating");
  const [validationMessage, setValidationMessage] = useState("");

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      setValidationMessage("No reset token provided");
      return;
    }

    async function validateToken() {
      try {
        const response = await fetch(`/api/auth/reset-password?token=${token}`);
        const data = await response.json();

        if (data.valid) {
          setStatus("valid");
        } else {
          setStatus("invalid");
          setValidationMessage(data.error || "Invalid or expired reset link");
        }
      } catch {
        setStatus("invalid");
        setValidationMessage("An error occurred");
      }
    }

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password || !confirmPassword) {
      setError("Both fields are required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        setError(data.error || "Failed to reset password");
      }
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
          {status === "validating" && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-cyan-500/10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              </div>
              <h1 className="font-display text-2xl font-bold text-slate-100 mb-2">
                Validating...
              </h1>
              <p className="text-slate-400">
                Please wait while we verify your reset link
              </p>
            </div>
          )}

          {status === "invalid" && (
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center"
              >
                <XCircle className="w-8 h-8 text-red-400" />
              </motion.div>
              <h1 className="font-display text-2xl font-bold text-slate-100 mb-2">
                Invalid Link
              </h1>
              <p className="text-slate-400 mb-8">
                {validationMessage}
              </p>
              <Link href="/forgot-password">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full !bg-gradient-to-r !from-yellow-400 !to-orange-500"
                >
                  Request New Link
                </Button>
              </Link>
            </div>
          )}

          {status === "valid" && (
            <>
              <div className="text-center mb-8">
                <h1 className="font-display text-3xl font-bold text-slate-100 mb-2">
                  Set new password
                </h1>
                <p className="text-slate-400">
                  Your new password must be at least 8 characters
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
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    label="New Password"
                    placeholder="Enter your new password"
                    icon={<Lock className="w-5 h-5" />}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                    required
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-[42px] text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    label="Confirm Password"
                    placeholder="Confirm your new password"
                    icon={<Lock className="w-5 h-5" />}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isSubmitting}
                    required
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-[42px] text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full !bg-gradient-to-r !from-yellow-400 !to-orange-500"
                  icon={isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                  iconPosition="right"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Resetting..." : "Reset Password"}
                </Button>
              </form>
            </>
          )}

          {status === "success" && (
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
                Password Reset!
              </h1>
              <p className="text-slate-400 mb-6">
                Your password has been successfully reset. Redirecting you to login...
              </p>
              <Link href="/login">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                >
                  Go to Login
                </Button>
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
