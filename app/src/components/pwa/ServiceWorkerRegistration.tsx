"use client";

import { useEffect, useState, useCallback, useRef } from "react";

export function ServiceWorkerRegistration() {
  const [showUpdateToast, setShowUpdateToast] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  const updateServiceWorker = useCallback(() => {
    if (registrationRef.current?.waiting) {
      // Tell the waiting service worker to skip waiting and become active
      registrationRef.current.waiting.postMessage({ type: "SKIP_WAITING" });
      setShowUpdateToast(false);
      // Reload the page to use the new service worker
      window.location.reload();
    }
  }, []);

  useEffect(() => {
    // Check if service workers are supported
    if (!("serviceWorker" in navigator)) {
      console.log("Service workers are not supported");
      return;
    }

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });

        console.log("Service Worker registered successfully:", registration);
        registrationRef.current = registration;

        // Check for updates immediately
        registration.update();

        // Handle updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New content is available, show update notification
              console.log("New content is available, please refresh.");
              setShowUpdateToast(true);
            }
          });
        });

        // Listen for controller change (when new SW takes over)
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          console.log("New service worker activated");
        });
      } catch (error) {
        console.error("Service Worker registration failed:", error);
      }
    };

    // Register when the window loads
    if (document.readyState === "complete") {
      registerServiceWorker();
    } else {
      window.addEventListener("load", registerServiceWorker);
      return () => window.removeEventListener("load", registerServiceWorker);
    }
  }, []);

  // Update toast UI
  if (!showUpdateToast) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg
              className="w-6 h-6 text-indigo-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">Update Available</p>
            <p className="text-sm text-zinc-400 mt-1">
              A new version of Studek is available. Refresh to update.
            </p>
          </div>
          <button
            onClick={() => setShowUpdateToast(false)}
            className="flex-shrink-0 text-zinc-400 hover:text-white"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={updateServiceWorker}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors"
          >
            Update Now
          </button>
          <button
            onClick={() => setShowUpdateToast(false)}
            className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
