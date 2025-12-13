"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Sparkles, ShieldCheck, Crown, Loader2 } from "lucide-react";
import { getAccessToken, useAuth } from "@/stores/auth";

type PlanItem = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  interval: "month" | "year";
  limits: {
    decks: number | null;
    study_sessions_per_deck: number | null;
    public_decks: number | null;
    ai_decks: number | null;
  };
  stripe_price_id: string | null;
};

type PlansResponse = {
  plans: PlanItem[];
  currentPlan: {
    id: string;
    slug: string;
    name: string;
    price_cents: number;
    interval: "month" | "year";
  } | null;
  subscriptionStatus: string | null;
};

const formatPrice = (plan: PlanItem | PlansResponse["currentPlan"]) => {
  if (!plan) return "$0.00";
  if (!("price_cents" in plan)) return "$0.00";
  if (plan.price_cents === 0) return "$0.00";
  return `$${(plan.price_cents / 100).toFixed(2)}`;
};

const PLAN_DESCRIPTIONS: Record<string, string[]> = {
  free: [
    "Up to 2 decks",
    "3 study sessions per deck",
    "1 public/shared deck",
    "AI decks not included",
  ],
  premium: [
    "Unlimited decks",
    "Unlimited study sessions",
    "Unlimited public/shared decks",
    "Up to 2 AI-generated decks",
  ],
  pro: [
    "Unlimited decks",
    "Unlimited study sessions",
    "Unlimited public/shared decks",
    "Unlimited AI-generated decks",
  ],
};

export function BillingSection() {
  const { user } = useAuth();
  const [plansData, setPlansData] = useState<PlansResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [actionPlan, setActionPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = async () => {
    const token = getAccessToken();
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/billing/plans", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = (await response.json()) as PlansResponse;

      if (!response.ok) {
        throw new Error((data as { error?: string }).error || "Failed to load plans");
      }

      setPlansData(data);
    } catch (err) {
      console.error("[Billing] Failed to load plans", err);
      setError("Unable to load plans right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const currentPlanSlug = useMemo(() => user?.plan?.slug || plansData?.currentPlan?.slug || "free", [user, plansData]);

  const handleSubscribe = async (planSlug: string) => {
    const token = getAccessToken();
    if (!token) return;

    setActionPlan(planSlug);
    setError(null);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: planSlug }),
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Unable to start checkout");
      }

      window.location.href = data.url;
    } catch (err) {
      console.error("[Billing] Checkout error", err);
      setError("We couldn't start checkout. Please try again.");
    } finally {
      setActionPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    const token = getAccessToken();
    if (!token) return;

    setActionPlan("manage");
    setError(null);

    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Unable to open billing portal");
      }

      window.location.href = data.url;
    } catch (err) {
      console.error("[Billing] Portal error", err);
      setError("We couldn't open the billing portal. Please try again.");
    } finally {
      setActionPlan(null);
    }
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm uppercase tracking-wide text-cyan-400">
            <Sparkles className="w-4 h-4" />
            Monetization
          </div>
          <h3 className="text-xl font-semibold text-zinc-100 mt-1">Subscription</h3>
          <p className="text-sm text-zinc-500">
            Current plan: {user?.plan?.name || plansData?.currentPlan?.name || "Free"} (
            {plansData?.subscriptionStatus || user?.subscription_status || "not subscribed"})
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Secure payments powered by Stripe
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading plans...
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(plansData?.plans || []).map((plan) => {
          const isCurrent = currentPlanSlug === plan.slug;
          const icon =
            plan.slug === "pro" ? (
              <Crown className="w-5 h-5" />
            ) : plan.slug === "premium" ? (
              <Sparkles className="w-5 h-5" />
            ) : (
              <ShieldCheck className="w-5 h-5" />
            );

          const ctaLabel = isCurrent
            ? "Current plan"
            : plan.slug === "free"
            ? "Included"
            : `Subscribe to ${plan.name}`;

          return (
            <div
              key={plan.id}
              className={`rounded-xl border p-5 space-y-4 ${
                isCurrent ? "border-emerald-500/40 bg-emerald-500/5" : "border-zinc-800 bg-zinc-900/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-zinc-100 font-semibold">
                  {icon}
                  {plan.name}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-zinc-100">{formatPrice(plan)}</div>
                  <div className="text-xs text-zinc-500">per {plan.interval}</div>
                </div>
              </div>

              <ul className="text-sm text-zinc-400 space-y-2">
                {(PLAN_DESCRIPTIONS[plan.slug] || []).map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    {item}
                  </li>
                ))}
              </ul>

              <Button
                variant={isCurrent ? "secondary" : "primary"}
                size="sm"
                className="w-full"
                disabled={isCurrent || plan.slug === "free" || actionPlan !== null}
                onClick={() => handleSubscribe(plan.slug)}
                icon={actionPlan === plan.slug ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
              >
                {ctaLabel}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between border-t border-zinc-800 pt-4 text-sm text-zinc-500">
        <span>
          Need to change or cancel your subscription?
        </span>
        <Button
          variant="ghost"
          size="sm"
          disabled={actionPlan !== null}
          onClick={handleManageSubscription}
          icon={actionPlan === "manage" ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
        >
          Manage in portal
        </Button>
      </div>
    </div>
  );
}
