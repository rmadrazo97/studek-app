"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Smartphone, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

type Platform = "android" | "ios" | "desktop" | "unknown";

// Detect platform at module level to avoid setState in effect
function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "unknown";
  const userAgent = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(userAgent)) return "ios";
  if (/android/.test(userAgent)) return "android";
  return "desktop";
}

function checkIsInstalled(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // @ts-expect-error - iOS specific property
    window.navigator.standalone === true
  );
}

function checkWasDismissed(): boolean {
  if (typeof localStorage === "undefined") return false;
  const wasDismissed = localStorage.getItem("pwa-install-dismissed");
  if (wasDismissed) {
    const dismissedTime = parseInt(wasDismissed, 10);
    // Show again after 7 days
    return Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000;
  }
  return false;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  // Initialize platform from detection function
  const [platform] = useState<Platform>(detectPlatform);
  const [isInstalled] = useState(checkIsInstalled);
  const [dismissed, setDismissed] = useState(checkWasDismissed);

  // Platform, isInstalled, and dismissed are now initialized via useState

  // Listen for beforeinstallprompt event
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Show prompt after a delay (don't interrupt user immediately)
      setTimeout(() => {
        if (!isInstalled && !dismissed) {
          setShowPrompt(true);
        }
      }, 30000); // 30 seconds delay
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Show iOS prompt after delay
    if (platform === "ios" && !isInstalled && !dismissed) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 30000);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [isInstalled, dismissed, platform]);

  // Handle install click
  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  }, [deferredPrompt]);

  // Handle dismiss
  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  }, []);

  // Don't show if already installed or dismissed
  if (isInstalled || dismissed || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
      >
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-700/50 rounded-2xl shadow-2xl overflow-hidden">
          {/* Decorative gradient bar */}
          <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

          <div className="p-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Install Studek</h3>
                  <p className="text-sm text-zinc-400">
                    {platform === "ios" ? "Add to Home Screen" : "Quick access"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            <p className="text-sm text-zinc-400 mb-4">
              Install Studek for faster access, offline study sessions, and a
              native app experience.
            </p>

            {/* Features */}
            <div className="flex gap-4 mb-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                Works offline
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                Fast launch
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                No app store
              </span>
            </div>

            {/* Actions */}
            {platform === "ios" ? (
              <div className="bg-zinc-800/50 rounded-xl p-3">
                <p className="text-sm text-zinc-300 mb-2">
                  To install on iOS:
                </p>
                <ol className="text-sm text-zinc-400 space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="text-indigo-400">1.</span>
                    Tap{" "}
                    <Share className="w-4 h-4 inline text-indigo-400 mx-1" />{" "}
                    Share
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-indigo-400">2.</span>
                    Scroll and tap &quot;Add to Home Screen&quot;
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-indigo-400">3.</span>
                    Tap &quot;Add&quot;
                  </li>
                </ol>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleInstall}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-medium py-3 px-4 rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                >
                  <Download className="w-4 h-4" />
                  Install App
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-xl transition-colors"
                >
                  Not now
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
