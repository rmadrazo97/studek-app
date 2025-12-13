# Monetization feature blueprint

## Plans

| Plan    | Price/mo | Decks | Study sessions/deck | Public/shared decks | AI-generated decks |
|---------|----------|-------|---------------------|---------------------|--------------------|
| Free    | $0.00    | 2     | 3                   | 1                   | 0                  |
| Premium | $3.99    | ∞     | ∞                   | ∞                   | 2                  |
| Pro     | $5.99    | ∞     | ∞                   | ∞                   | ∞                  |

Default plan for new users: Free.

## Data model & migrations

- Migration `012_monetization_plans.sql`
  - New tables: `plans`, `user_subscriptions`.
  - Users: `plan_id` (default `plan_free`), `plan_started_at`.
  - Decks: `is_ai_generated`.
  - Seeds the three plans idempotently.
- Seed helper: `npm run db:seed:plans` (runs migrations and upserts plan rows).

## Limit enforcement (server)

- Central checker: `src/lib/billing/limits.ts`.
- Deck creation: `/api/decks` (manual), `/api/ai/generate` (new deck), `/api/import/apkg`, `/api/decks/shared/[code]` (clone) guard deck counts; AI decks also check AI quota; shared clone checks public/shared limit.
- Study sessions: `/api/reviews/session` blocks when a deck exceeds sessions-per-deck limit.
- Errors: 402 with `{ error: "plan_limit_exceeded", code, limit, current, plan }`.

## Billing (Stripe)

- Endpoints:
  - `POST /api/billing/checkout` → Stripe Checkout (subscription).
  - `POST /api/billing/portal` → Stripe Customer Portal.
  - `GET /api/billing/plans` → plan list + current subscription status.
  - `POST /api/billing/webhook` → handles `checkout.session.completed`, `customer.subscription.*`.
- Env vars:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_PRICE_PREMIUM`
  - `STRIPE_PRICE_PRO`
  - `STRIPE_WEBHOOK_SECRET`
  - `NEXT_PUBLIC_APP_URL` (fallbacks to `APP_URL` or localhost)
- Webhook dev helper:
  - `stripe listen --forward-to http://localhost:3000/api/billing/webhook`

## Client flow

- Settings → Subscription & Billing section (`src/app/(dashboard)/settings/page.tsx`) renders plan cards and redirects to Checkout/Portal via `/api/billing/*`.
- Landing pricing updated to Free / Premium / Pro tiers with the new limits.

## Quick setup

1) Install deps: `npm install`
2) Run migrations: `npm run db:migrate`
3) Seed plans: `npm run db:seed:plans`
4) Configure env vars above
5) Stripe CLI webhook (for local): `stripe listen --forward-to http://localhost:3000/api/billing/webhook`

## Test checklist

- Migration runs clean and seeds plans.
- Free plan:
  - Cannot create >2 decks.
  - Study sessions on one deck blocked after 3.
  - Public/shared clone blocked after 1.
  - AI deck creation blocked.
- Premium plan:
  - Deck/public/session unlimited; AI decks blocked after 2.
- Pro plan:
  - No limits.
- Checkout returns Stripe URL; Portal opens for existing customer.
- Webhook updates user plan on `checkout.session.completed` and on subscription update/delete. 
