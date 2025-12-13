"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Bell,
  Smartphone,
  Clock,
  Moon,
  Loader2,
  CheckCircle,
  AlertCircle,
  BellRing,
  Flame,
  Calendar,
  Trophy,
  Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getAccessToken } from "@/stores/auth";

interface NotificationPreferences {
  emailEnabled: boolean;
  emailStudyReminders: boolean;
  emailStreakWarnings: boolean;
  emailWeeklySummary: boolean;
  emailAchievementUnlocks: boolean;
  pushEnabled: boolean;
  pushStudyReminders: boolean;
  pushStreakWarnings: boolean;
  pushCardsDue: boolean;
  reminderTime: string;
  timezone: string;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

const defaultPreferences: NotificationPreferences = {
  emailEnabled: true,
  emailStudyReminders: true,
  emailStreakWarnings: true,
  emailWeeklySummary: true,
  emailAchievementUnlocks: true,
  pushEnabled: true,
  pushStudyReminders: true,
  pushStreakWarnings: true,
  pushCardsDue: true,
  reminderTime: "09:00",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "08:00",
};

export default function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | null>(null);
  const [isSubscribingPush, setIsSubscribingPush] = useState(false);

  // Load preferences
  useEffect(() => {
    async function loadPreferences() {
      try {
        const token = getAccessToken();
        const response = await fetch("/api/notifications/preferences", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setPreferences(data.preferences);
        }
      } catch (error) {
        console.error("Failed to load preferences:", error);
      } finally {
        setIsLoading(false);
      }
    }

    // Check push notification support
    if ("Notification" in window && "serviceWorker" in navigator) {
      setPushSupported(true);
      setPushPermission(Notification.permission);
    }

    loadPreferences();
  }, []);

  // Save preferences
  const savePreferences = useCallback(async (updates: Partial<NotificationPreferences>) => {
    setIsSaving(true);
    setMessage(null);

    try {
      const token = getAccessToken();
      const response = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences);
        setMessage({ type: "success", text: "Preferences saved" });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const data = await response.json();
        setMessage({ type: "error", text: data.error || "Failed to save preferences" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to save preferences" });
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Toggle handler
  const handleToggle = (key: keyof NotificationPreferences) => {
    const newValue = !preferences[key];
    setPreferences({ ...preferences, [key]: newValue });
    savePreferences({ [key]: newValue });
  };

  // Time change handler
  const handleTimeChange = (key: "reminderTime" | "quietHoursStart" | "quietHoursEnd", value: string) => {
    setPreferences({ ...preferences, [key]: value });
    savePreferences({ [key]: value });
  };

  // Request push notification permission and subscribe
  const handleEnablePush = async () => {
    if (!pushSupported) return;

    setIsSubscribingPush(true);
    setMessage(null);

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      setPushPermission(permission);

      if (permission !== "granted") {
        setMessage({ type: "error", text: "Push notification permission denied" });
        setIsSubscribingPush(false);
        return;
      }

      // Get VAPID public key
      const vapidResponse = await fetch("/api/notifications/vapid-key");
      if (!vapidResponse.ok) {
        setMessage({ type: "error", text: "Push notifications not available" });
        setIsSubscribingPush(false);
        return;
      }
      const { vapidPublicKey } = await vapidResponse.json();

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // Send subscription to server
      const token = getAccessToken();
      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
        }),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Push notifications enabled!" });
        setPreferences({ ...preferences, pushEnabled: true });
      } else {
        setMessage({ type: "error", text: "Failed to enable push notifications" });
      }
    } catch (error) {
      console.error("Push subscription error:", error);
      setMessage({ type: "error", text: "Failed to enable push notifications" });
    } finally {
      setIsSubscribingPush(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Message */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border border-red-500/30 text-red-400"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {message.text}
          {isSaving && <Loader2 className="w-4 h-4 animate-spin ml-auto" />}
        </motion.div>
      )}

      {/* Email Notifications */}
      <div>
        <h3 className="text-sm font-medium text-zinc-100 mb-3 flex items-center gap-2">
          <Mail className="w-4 h-4 text-cyan-400" />
          Email Notifications
        </h3>
        <div className="bg-zinc-800/50 rounded-xl divide-y divide-zinc-700/50">
          <ToggleRow
            icon={<Mail className="w-4 h-4" />}
            title="Email notifications"
            description="Receive notifications via email"
            enabled={preferences.emailEnabled}
            onToggle={() => handleToggle("emailEnabled")}
          />
          {preferences.emailEnabled && (
            <>
              <ToggleRow
                icon={<BellRing className="w-4 h-4" />}
                title="Study reminders"
                description="Daily reminders to study your flashcards"
                enabled={preferences.emailStudyReminders}
                onToggle={() => handleToggle("emailStudyReminders")}
                indent
              />
              <ToggleRow
                icon={<Flame className="w-4 h-4" />}
                title="Streak warnings"
                description="Get notified when your streak is at risk"
                enabled={preferences.emailStreakWarnings}
                onToggle={() => handleToggle("emailStreakWarnings")}
                indent
              />
              <ToggleRow
                icon={<Calendar className="w-4 h-4" />}
                title="Weekly summary"
                description="Weekly progress report every Sunday"
                enabled={preferences.emailWeeklySummary}
                onToggle={() => handleToggle("emailWeeklySummary")}
                indent
              />
              <ToggleRow
                icon={<Trophy className="w-4 h-4" />}
                title="Achievements"
                description="Get notified when you unlock achievements"
                enabled={preferences.emailAchievementUnlocks}
                onToggle={() => handleToggle("emailAchievementUnlocks")}
                indent
              />
            </>
          )}
        </div>
      </div>

      {/* Push Notifications */}
      <div>
        <h3 className="text-sm font-medium text-zinc-100 mb-3 flex items-center gap-2">
          <Bell className="w-4 h-4 text-cyan-400" />
          Push Notifications
        </h3>
        <div className="bg-zinc-800/50 rounded-xl divide-y divide-zinc-700/50">
          {!pushSupported ? (
            <div className="p-4 text-sm text-zinc-500">
              Push notifications are not supported in your browser.
            </div>
          ) : pushPermission === "denied" ? (
            <div className="p-4 text-sm text-amber-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Push notifications are blocked. Enable them in your browser settings.
            </div>
          ) : pushPermission !== "granted" ? (
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-zinc-400" />
                  <div>
                    <p className="text-sm font-medium text-zinc-100">Enable push notifications</p>
                    <p className="text-xs text-zinc-500">Get notified even when the app is closed</p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleEnablePush}
                  disabled={isSubscribingPush}
                  icon={isSubscribingPush ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                >
                  {isSubscribingPush ? "Enabling..." : "Enable"}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <ToggleRow
                icon={<Bell className="w-4 h-4" />}
                title="Push notifications"
                description="Receive notifications on this device"
                enabled={preferences.pushEnabled}
                onToggle={() => handleToggle("pushEnabled")}
              />
              {preferences.pushEnabled && (
                <>
                  <ToggleRow
                    icon={<BellRing className="w-4 h-4" />}
                    title="Study reminders"
                    description="Daily reminders to study"
                    enabled={preferences.pushStudyReminders}
                    onToggle={() => handleToggle("pushStudyReminders")}
                    indent
                  />
                  <ToggleRow
                    icon={<Flame className="w-4 h-4" />}
                    title="Streak warnings"
                    description="Alerts when your streak is at risk"
                    enabled={preferences.pushStreakWarnings}
                    onToggle={() => handleToggle("pushStreakWarnings")}
                    indent
                  />
                  <ToggleRow
                    icon={<Inbox className="w-4 h-4" />}
                    title="Cards due"
                    description="When you have cards ready for review"
                    enabled={preferences.pushCardsDue}
                    onToggle={() => handleToggle("pushCardsDue")}
                    indent
                  />
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Reminder Time */}
      <div>
        <h3 className="text-sm font-medium text-zinc-100 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          Reminder Schedule
        </h3>
        <div className="bg-zinc-800/50 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-zinc-400" />
              <div>
                <p className="text-sm font-medium text-zinc-100">Daily reminder time</p>
                <p className="text-xs text-zinc-500">When to send your study reminder</p>
              </div>
            </div>
            <input
              type="time"
              value={preferences.reminderTime}
              onChange={(e) => handleTimeChange("reminderTime", e.target.value)}
              className="bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="text-xs text-zinc-500">
            Timezone: {preferences.timezone}
          </div>
        </div>
      </div>

      {/* Quiet Hours */}
      <div>
        <h3 className="text-sm font-medium text-zinc-100 mb-3 flex items-center gap-2">
          <Moon className="w-4 h-4 text-cyan-400" />
          Quiet Hours
        </h3>
        <div className="bg-zinc-800/50 rounded-xl divide-y divide-zinc-700/50">
          <ToggleRow
            icon={<Moon className="w-4 h-4" />}
            title="Enable quiet hours"
            description="Pause notifications during certain hours"
            enabled={preferences.quietHoursEnabled}
            onToggle={() => handleToggle("quietHoursEnabled")}
          />
          {preferences.quietHoursEnabled && (
            <div className="p-4 flex items-center justify-between">
              <span className="text-sm text-zinc-400">Quiet from</span>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={preferences.quietHoursStart}
                  onChange={(e) => handleTimeChange("quietHoursStart", e.target.value)}
                  className="bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <span className="text-zinc-500">to</span>
                <input
                  type="time"
                  value={preferences.quietHoursEnd}
                  onChange={(e) => handleTimeChange("quietHoursEnd", e.target.value)}
                  className="bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Toggle Row Component
function ToggleRow({
  icon,
  title,
  description,
  enabled,
  onToggle,
  indent = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  indent?: boolean;
}) {
  return (
    <div className={`p-4 flex items-center justify-between ${indent ? "pl-10" : ""}`}>
      <div className="flex items-center gap-3">
        <span className="text-zinc-400">{icon}</span>
        <div>
          <p className="text-sm font-medium text-zinc-100">{title}</p>
          <p className="text-xs text-zinc-500">{description}</p>
        </div>
      </div>
      <button
        onClick={onToggle}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          enabled ? "bg-cyan-500" : "bg-zinc-600"
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
            enabled ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

// Convert VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
