"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  User,
  Settings as SettingsIcon,
  CreditCard,
  Mail,
  Save,
  Loader2,
  Check,
  Crown,
  Sparkles,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { useAuth, createAuthenticatedFetch } from "@/stores/auth";

type TabType = "profile" | "settings" | "billing";

interface SubscriptionPlan {
  key: string;
  name: string;
  description: string | null;
  priceMonthly: number;
  priceYearly: number;
  features: Array<{
    key: string;
    name: string;
    value: string;
    valueType: string;
  }>;
}

interface Subscription {
  id: string;
  planKey: string;
  planName: string;
  status: string;
  billingCycle: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId: string | null;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Profile state
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");

  // Settings state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [studyReminders, setStudyReminders] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  // Billing state
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoadingBilling, setIsLoadingBilling] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);

  const authFetch = useCallback(() => createAuthenticatedFetch(), []);

  // Fetch subscription data
  useEffect(() => {
    if (activeTab === "billing") {
      const fetchBillingData = async () => {
        setIsLoadingBilling(true);
        setBillingError(null);

        try {
          const fetch = authFetch();

          const [subRes, plansRes] = await Promise.all([
            fetch("/api/subscriptions"),
            fetch("/api/subscriptions/plans"),
          ]);

          if (subRes.ok) {
            const subData = await subRes.json();
            setSubscription(subData.subscription);
          }

          if (plansRes.ok) {
            const plansData = await plansRes.json();
            setPlans(plansData.plans || []);
          }
        } catch {
          setBillingError("Failed to load billing information");
        } finally {
          setIsLoadingBilling(false);
        }
      };

      fetchBillingData();
    }
  }, [activeTab, authFetch]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleUpgrade = async (planKey: string, billingCycle: 'monthly' | 'yearly') => {
    try {
      const fetch = authFetch();
      const res = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planKey,
          billingCycle,
          successUrl: `${window.location.origin}/settings?tab=billing&success=true`,
          cancelUrl: `${window.location.origin}/settings?tab=billing`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        window.location.href = data.url;
      } else {
        const error = await res.json();
        setBillingError(error.error || "Failed to create checkout session");
      }
    } catch {
      setBillingError("Failed to start checkout");
    }
  };

  const handleManageSubscription = async () => {
    try {
      const fetch = authFetch();
      const res = await fetch("/api/subscriptions/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/settings?tab=billing`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        window.location.href = data.url;
      } else {
        const error = await res.json();
        setBillingError(error.error || "Failed to open billing portal");
      }
    } catch {
      setBillingError("Failed to open billing portal");
    }
  };

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "settings" as const, label: "Settings", icon: SettingsIcon },
    { id: "billing" as const, label: "Billing", icon: CreditCard },
  ];

  const getPlanIcon = (planKey: string) => {
    if (planKey === "premium") return Crown;
    if (planKey === "pro") return Sparkles;
    return User;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold font-display text-zinc-100">
          Settings
        </h1>
        <p className="text-zinc-500 mt-1">
          Manage your account, preferences, and subscription
        </p>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex gap-2 mb-8 p-1 bg-[#0f0f11] rounded-xl border border-zinc-800 w-fit"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all
              ${
                activeTab === tab.id
                  ? "bg-zinc-800 text-cyan-400"
                  : "text-zinc-400 hover:text-zinc-100"
              }
            `}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-[#0f0f11] border border-zinc-800 rounded-2xl p-6"
      >
        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-zinc-100 mb-1">
                Profile Information
              </h2>
              <p className="text-sm text-zinc-500">
                Update your personal details
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  placeholder="Enter your email"
                />
              </div>

              <div className="pt-4">
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-zinc-900 font-medium rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : saveSuccess ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSaving ? "Saving..." : saveSuccess ? "Saved!" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-zinc-100 mb-1">
                Preferences
              </h2>
              <p className="text-sm text-zinc-500">
                Customize your experience
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-xl">
                <div>
                  <h3 className="text-sm font-medium text-zinc-100">
                    Email Notifications
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Receive updates about your account
                  </p>
                </div>
                <button
                  onClick={() => setEmailNotifications(!emailNotifications)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    emailNotifications ? "bg-cyan-500" : "bg-zinc-700"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                      emailNotifications ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-xl">
                <div>
                  <h3 className="text-sm font-medium text-zinc-100">
                    Study Reminders
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Get reminded to review your cards
                  </p>
                </div>
                <button
                  onClick={() => setStudyReminders(!studyReminders)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    studyReminders ? "bg-cyan-500" : "bg-zinc-700"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                      studyReminders ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-xl">
                <div>
                  <h3 className="text-sm font-medium text-zinc-100">
                    Dark Mode
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Use dark theme (always enabled)
                  </p>
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  disabled
                  className="w-12 h-6 rounded-full bg-cyan-500 cursor-not-allowed"
                >
                  <div className="w-5 h-5 bg-white rounded-full shadow-md transform translate-x-6" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Billing Tab */}
        {activeTab === "billing" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-zinc-100 mb-1">
                Billing & Subscription
              </h2>
              <p className="text-sm text-zinc-500">
                Manage your subscription and payment methods
              </p>
            </div>

            {isLoadingBilling ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
              </div>
            ) : billingError ? (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm">{billingError}</p>
              </div>
            ) : (
              <>
                {/* Current Subscription */}
                <div className="p-5 bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-zinc-700 rounded-2xl">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const PlanIcon = getPlanIcon(subscription?.planKey || "free");
                        return (
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              subscription?.planKey === "premium"
                                ? "bg-gradient-to-br from-amber-500 to-orange-500"
                                : subscription?.planKey === "pro"
                                ? "bg-gradient-to-br from-violet-500 to-purple-500"
                                : "bg-zinc-800"
                            }`}
                          >
                            <PlanIcon className="w-6 h-6 text-white" />
                          </div>
                        );
                      })()}
                      <div>
                        <h3 className="text-lg font-semibold text-zinc-100">
                          {subscription?.planName || "Free"} Plan
                        </h3>
                        <p className="text-sm text-zinc-500">
                          {subscription?.status === "active"
                            ? subscription.cancelAtPeriodEnd
                              ? "Cancels at period end"
                              : "Active subscription"
                            : "Current plan"}
                        </p>
                      </div>
                    </div>
                    {subscription && subscription.planKey !== "free" && (
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          subscription.status === "active"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {subscription.status}
                      </span>
                    )}
                  </div>

                  {subscription && subscription.planKey !== "free" && subscription.currentPeriodStart && subscription.currentPeriodEnd && (
                    <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-zinc-800/50 rounded-xl">
                      <div>
                        <p className="text-xs text-zinc-500 mb-1">Current Period</p>
                        <p className="text-sm text-zinc-300">
                          {formatDate(subscription.currentPeriodStart)} -{" "}
                          {formatDate(subscription.currentPeriodEnd)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 mb-1">Billing Cycle</p>
                        <p className="text-sm text-zinc-300 capitalize">
                          {subscription.billingCycle}
                        </p>
                      </div>
                    </div>
                  )}

                  {subscription && subscription.planKey !== "free" && (
                    <button
                      onClick={handleManageSubscription}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-300 hover:text-zinc-100 border border-zinc-700 hover:border-zinc-600 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Manage Subscription
                    </button>
                  )}
                </div>

                {/* Available Plans */}
                {(!subscription || subscription.planKey === "free") && plans.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-100 mb-4">
                      Upgrade Your Plan
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      {plans
                        .filter((p) => p.key !== "free")
                        .map((plan) => {
                          const PlanIcon = getPlanIcon(plan.key);

                          return (
                            <div
                              key={plan.key}
                              className={`p-5 rounded-2xl border transition-all ${
                                plan.key === "pro"
                                  ? "bg-gradient-to-br from-violet-500/10 to-purple-500/5 border-violet-500/30 hover:border-violet-500/50"
                                  : "bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/30 hover:border-amber-500/50"
                              }`}
                            >
                              <div className="flex items-center gap-3 mb-3">
                                <div
                                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                    plan.key === "pro"
                                      ? "bg-gradient-to-br from-violet-500 to-purple-500"
                                      : "bg-gradient-to-br from-amber-500 to-orange-500"
                                  }`}
                                >
                                  <PlanIcon className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-zinc-100">
                                    {plan.name}
                                  </h4>
                                  <p className="text-xs text-zinc-400">
                                    ${plan.priceMonthly}/mo or ${plan.priceYearly}/yr
                                  </p>
                                </div>
                              </div>

                              <ul className="space-y-2 mb-4">
                                {plan.features.slice(0, 4).map((feature) => (
                                  <li
                                    key={feature.key}
                                    className="flex items-center gap-2 text-sm text-zinc-400"
                                  >
                                    <Check className="w-4 h-4 text-emerald-400" />
                                    <span>
                                      {feature.name}:{" "}
                                      <span className="text-zinc-300">
                                        {feature.value === "true"
                                          ? "Yes"
                                          : feature.value === "false"
                                          ? "No"
                                          : feature.value === "-1"
                                          ? "Unlimited"
                                          : feature.value}
                                      </span>
                                    </span>
                                  </li>
                                ))}
                              </ul>

                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleUpgrade(plan.key, 'monthly')}
                                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                                    plan.key === "pro"
                                      ? "bg-violet-500 text-white hover:bg-violet-400"
                                      : "bg-amber-500 text-zinc-900 hover:bg-amber-400"
                                  }`}
                                >
                                  Monthly
                                </button>
                                <button
                                  onClick={() => handleUpgrade(plan.key, 'yearly')}
                                  className="flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                                >
                                  Yearly
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
