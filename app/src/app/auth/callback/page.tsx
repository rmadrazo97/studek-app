"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

// Storage keys (must match auth store)
const STORAGE_KEYS = {
  ACCESS_TOKEN: "studek_access_token",
  REFRESH_TOKEN: "studek_refresh_token",
  USER: "studek_user",
} as const;

export default function OAuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const handleCallback = () => {
      try {
        // Get data from URL fragment
        const hash = window.location.hash.substring(1);
        if (!hash) {
          setStatus("error");
          setError("No authentication data received");
          return;
        }

        const params = new URLSearchParams(hash);
        const accessToken = params.get("accessToken");
        const refreshToken = params.get("refreshToken");
        const userJson = params.get("user");

        if (!accessToken || !refreshToken || !userJson) {
          setStatus("error");
          setError("Invalid authentication data");
          return;
        }

        // Parse user data
        const user = JSON.parse(userJson);

        // Store in localStorage
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

        setStatus("success");

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          // Clear the hash from URL for security
          window.history.replaceState(null, "", "/auth/callback");
          router.push("/dashboard");
        }, 1000);
      } catch (err) {
        console.error("[OAuth Callback] Error:", err);
        setStatus("error");
        setError("Failed to process authentication");
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-12">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[var(--gradient-hero)]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.15),transparent_70%)]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass rounded-2xl p-8 text-center">
          {status === "loading" && (
            <>
              <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
              <h1 className="font-display text-2xl font-bold text-slate-100 mb-2">
                Signing you in...
              </h1>
              <p className="text-slate-400">
                Please wait while we complete your authentication.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h1 className="font-display text-2xl font-bold text-slate-100 mb-2">
                Welcome!
              </h1>
              <p className="text-slate-400">
                Redirecting you to your dashboard...
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h1 className="font-display text-2xl font-bold text-slate-100 mb-2">
                Authentication Failed
              </h1>
              <p className="text-slate-400 mb-6">{error}</p>
              <button
                onClick={() => router.push("/login")}
                className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-medium rounded-lg transition-colors"
              >
                Back to Login
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
