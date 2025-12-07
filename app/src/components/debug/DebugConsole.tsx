"use client";

import { useEffect, useState, useCallback } from "react";

/**
 * Mobile Debug Console using Eruda
 *
 * Enables a mobile-friendly debug console for testing PWAs on devices.
 *
 * Activation methods:
 * 1. URL parameter: ?debug=true (persists to localStorage)
 * 2. localStorage: localStorage.setItem('debug_console', 'true')
 * 3. Triple-tap on screen corner (bottom-right, 3 taps within 1s)
 *
 * To disable: ?debug=false or localStorage.removeItem('debug_console')
 */

const STORAGE_KEY = "debug_console";
const TAP_THRESHOLD = 3;
const TAP_TIMEOUT = 1000; // 1 second to complete triple-tap
const CORNER_SIZE = 60; // pixels from corner

export function DebugConsole() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Check if debug should be enabled
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const debugParam = urlParams.get("debug");

    if (debugParam === "true") {
      localStorage.setItem(STORAGE_KEY, "true");
      setIsEnabled(true);
      // Clean URL
      urlParams.delete("debug");
      const newUrl = urlParams.toString()
        ? `${window.location.pathname}?${urlParams.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    } else if (debugParam === "false") {
      localStorage.removeItem(STORAGE_KEY);
      setIsEnabled(false);
      // Clean URL
      urlParams.delete("debug");
      const newUrl = urlParams.toString()
        ? `${window.location.pathname}?${urlParams.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    } else {
      // Check localStorage
      const stored = localStorage.getItem(STORAGE_KEY);
      setIsEnabled(stored === "true");
    }
  }, []);

  // Triple-tap to toggle debug console
  useEffect(() => {
    if (typeof window === "undefined") return;

    let tapCount = 0;
    let tapTimeout: NodeJS.Timeout | null = null;

    const handleTap = (e: TouchEvent | MouseEvent) => {
      const x = "touches" in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
      const y = "touches" in e ? e.touches[0]?.clientY ?? 0 : e.clientY;

      // Check if tap is in bottom-right corner
      const isInCorner =
        x > window.innerWidth - CORNER_SIZE &&
        y > window.innerHeight - CORNER_SIZE;

      if (!isInCorner) {
        tapCount = 0;
        return;
      }

      tapCount++;

      if (tapTimeout) clearTimeout(tapTimeout);

      if (tapCount >= TAP_THRESHOLD) {
        tapCount = 0;
        // Toggle debug console
        const newState = localStorage.getItem(STORAGE_KEY) !== "true";
        if (newState) {
          localStorage.setItem(STORAGE_KEY, "true");
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
        setIsEnabled(newState);

        // Show feedback
        const msg = newState ? "Debug console enabled" : "Debug console disabled";
        console.log(`[Debug] ${msg}`);
      }

      tapTimeout = setTimeout(() => {
        tapCount = 0;
      }, TAP_TIMEOUT);
    };

    document.addEventListener("touchstart", handleTap, { passive: true });
    document.addEventListener("click", handleTap);

    return () => {
      document.removeEventListener("touchstart", handleTap);
      document.removeEventListener("click", handleTap);
      if (tapTimeout) clearTimeout(tapTimeout);
    };
  }, []);

  // Load eruda when enabled
  useEffect(() => {
    if (!isEnabled || isLoaded) return;

    const loadEruda = async () => {
      try {
        // Dynamically load eruda from CDN
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/eruda@3.0.1/eruda.min.js";
        script.onload = () => {
          // @ts-expect-error eruda is loaded globally
          if (window.eruda) {
            // @ts-expect-error eruda is loaded globally
            window.eruda.init({
              defaults: {
                displaySize: 50,
                transparency: 0.9,
                theme: "Material Palenight",
              },
            });
            setIsLoaded(true);
            console.log("[Debug] Eruda console initialized");
            console.log("[Debug] Triple-tap bottom-right corner to toggle");
          }
        };
        script.onerror = () => {
          console.error("[Debug] Failed to load eruda");
        };
        document.head.appendChild(script);
      } catch (error) {
        console.error("[Debug] Error loading eruda:", error);
      }
    };

    loadEruda();
  }, [isEnabled, isLoaded]);

  // Destroy eruda when disabled
  useEffect(() => {
    if (isEnabled || !isLoaded) return;

    try {
      // @ts-expect-error eruda is loaded globally
      if (window.eruda) {
        // @ts-expect-error eruda is loaded globally
        window.eruda.destroy();
        setIsLoaded(false);
        console.log("[Debug] Eruda console destroyed");
      }
    } catch (error) {
      console.error("[Debug] Error destroying eruda:", error);
    }
  }, [isEnabled, isLoaded]);

  // Expose global debug helper
  useEffect(() => {
    if (typeof window === "undefined") return;

    // @ts-expect-error adding debug helper to window
    window.enableDebug = () => {
      localStorage.setItem(STORAGE_KEY, "true");
      setIsEnabled(true);
      console.log("[Debug] Debug console enabled. Refresh may be needed.");
    };

    // @ts-expect-error adding debug helper to window
    window.disableDebug = () => {
      localStorage.removeItem(STORAGE_KEY);
      setIsEnabled(false);
      console.log("[Debug] Debug console disabled.");
    };

    return () => {
      // @ts-expect-error cleaning up
      delete window.enableDebug;
      // @ts-expect-error cleaning up
      delete window.disableDebug;
    };
  }, []);

  return null; // This component doesn't render anything visible
}
