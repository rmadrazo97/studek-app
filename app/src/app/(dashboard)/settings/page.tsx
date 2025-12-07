"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Shield,
  Bell,
  Key,
  LogOut,
  CheckCircle,
  AlertCircle,
  Loader2,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth, getAccessToken } from "@/stores/auth";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();

  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleResendVerification = async () => {
    setIsResendingVerification(true);
    setVerificationMessage(null);

    try {
      const token = getAccessToken();
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setVerificationMessage({
          type: "success",
          text: data.message || "Verification email sent!",
        });
      } else {
        setVerificationMessage({
          type: "error",
          text: data.error || "Failed to send verification email",
        });
      }
    } catch {
      setVerificationMessage({
        type: "error",
        text: "An error occurred. Please try again.",
      });
    } finally {
      setIsResendingVerification(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-zinc-100 mb-2">Settings</h1>
        <p className="text-zinc-400">Manage your account settings and preferences</p>
      </motion.div>

      {/* Account Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-8"
      >
        <h2 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-cyan-400" />
          Account
        </h2>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-6">
          {/* Profile Info */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
              <span className="text-2xl font-bold text-[#09090b]">
                {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "?"}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-medium text-zinc-100">
                {user?.name || "User"}
              </h3>
              <p className="text-sm text-zinc-400">{user?.email}</p>
              <p className="text-xs text-zinc-500 mt-1">
                Member since {user?.created_at ? formatDate(user.created_at) : "N/A"}
              </p>
            </div>
          </div>

          {/* Email Verification Status */}
          <div className="border-t border-zinc-800 pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-zinc-400" />
                <div>
                  <p className="text-sm font-medium text-zinc-100">Email Verification</p>
                  <p className="text-xs text-zinc-500">
                    {user?.email_verified
                      ? "Your email is verified"
                      : "Verify your email to unlock all features"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {user?.email_verified ? (
                  <span className="flex items-center gap-1.5 text-sm text-emerald-400">
                    <CheckCircle className="w-4 h-4" />
                    Verified
                  </span>
                ) : (
                  <>
                    <span className="flex items-center gap-1.5 text-sm text-amber-400">
                      <AlertCircle className="w-4 h-4" />
                      Not verified
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleResendVerification}
                      disabled={isResendingVerification}
                      icon={
                        isResendingVerification ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )
                      }
                    >
                      {isResendingVerification ? "Sending..." : "Resend"}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Verification Message */}
            {verificationMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-4 p-3 rounded-lg text-sm ${
                  verificationMessage.type === "success"
                    ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                    : "bg-red-500/10 border border-red-500/30 text-red-400"
                }`}
              >
                {verificationMessage.text}
              </motion.div>
            )}
          </div>
        </div>
      </motion.section>

      {/* Security Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-8"
      >
        <h2 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-cyan-400" />
          Security
        </h2>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl divide-y divide-zinc-800">
          {/* Change Password */}
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-zinc-400" />
              <div>
                <p className="text-sm font-medium text-zinc-100">Password</p>
                <p className="text-xs text-zinc-500">Change your password</p>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              Change
            </Button>
          </div>

          {/* Roles */}
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-zinc-400" />
              <div>
                <p className="text-sm font-medium text-zinc-100">Account Type</p>
                <p className="text-xs text-zinc-500">Your assigned roles</p>
              </div>
            </div>
            <div className="flex gap-2">
              {user?.roles.map((role) => (
                <span
                  key={role}
                  className="px-2.5 py-1 text-xs font-medium rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Notifications Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mb-8"
      >
        <h2 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-cyan-400" />
          Notifications
        </h2>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
          <p className="text-sm text-zinc-500 text-center py-4">
            Notification preferences coming soon
          </p>
        </div>
      </motion.section>

      {/* Danger Zone */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h2 className="text-lg font-semibold text-zinc-100 mb-4">Account Actions</h2>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5 text-zinc-400" />
              <div>
                <p className="text-sm font-medium text-zinc-100">Sign Out</p>
                <p className="text-xs text-zinc-500">Sign out of your account</p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLogout}
              className="!text-red-400 hover:!bg-red-500/10 hover:!border-red-500/30"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
