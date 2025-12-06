# Studek App

## Live Site
http://155.138.237.103

## Workflow
- Develop locally on `main` branch
- Push to remote triggers automatic deployment via GitHub Actions
- Docker Compose handles Next.js app + SQLite database

## GitHub Actions (Automatic Deployment)
On push to `main`:
1. Build & lint the app
2. Build Docker image → push to ghcr.io
3. SSH to server → pull image → restart containers

### Required GitHub Secrets
| Secret | Description |
|--------|-------------|
| `VPS_HOST` | Server IP: `155.138.237.103` |
| `VPS_USERNAME` | SSH user: `root` |
| `VPS_SSH_KEY` | Private SSH key (contents of `id_ed25519`) |
| `GHCR_PAT` | GitHub PAT with `read:packages` scope |
| `BACKEND_SECRETS` | JSON object with environment variables (see below) |

### BACKEND_SECRETS JSON Format
```json
{
  "JWT_SECRET": "your-secure-jwt-secret",
  "STRIPE_SECRET_KEY": "sk_live_...",
  "STRIPE_PUBLISHABLE_KEY": "pk_live_...",
  "STRIPE_WEBHOOK_SECRET": "whsec_...",
  "STRIPE_PRICE_PRO_MONTHLY": "price_...",
  "STRIPE_PRICE_PRO_YEARLY": "price_...",
  "STRIPE_PRICE_MAX_MONTHLY": "price_...",
  "STRIPE_PRICE_MAX_YEARLY": "price_...",
  "LOGS_USERNAME": "admin",
  "LOGS_PASSWORD": "your-logs-password"
}
```

## Server Access
```bash
ssh -i development-credentials/id_ed25519 root@155.138.237.103
```
- **Repo:** `/root/studek-app`
- **Stack:** Next.js + Docker + SQLite + Nginx

## Docker Commands
```bash
# View logs
docker compose logs -f app

# Restart
docker compose restart app

# Rebuild and restart
docker compose up -d --build

# Check status
docker compose ps
```

## Local Development
```bash
cd app && npm run dev
```

Or with Docker:
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

## Development Guidelines

### React Hooks Rules
- **Never call hooks after early returns** - All `useState`, `useCallback`, `useEffect`, `useMemo` must be called before any `return` statement
- Move early returns (`if (!data) return null`) to after all hook declarations
- Add null checks inside callbacks instead of returning early before hooks

### ESLint Configuration
- Uses Next.js 16 with React Compiler (strict mode)
- Some rules downgraded to warnings in `eslint.config.mjs`:
  - `react-hooks/set-state-in-effect` - setState in effects (use sparingly)
  - `react-hooks/preserve-manual-memoization` - useMemo dep mismatches
  - `react/display-name` - anonymous components
- Run `npm run lint` before committing - **0 errors required** for CI to pass

### Tech Stack
- **Framework:** Next.js 16 (App Router, Turbopack)
- **Database:** SQLite with better-sqlite3
- **Payments:** Stripe (Checkout, Customer Portal, Webhooks)
- **Styling:** Tailwind CSS v4
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Algorithm:** FSRS (spaced repetition)

## Subscription System

### Overview
Custom subscription management with SQLite and Stripe integration.
- **SQLite** stores all subscription data (plans, features, subscriptions, Stripe customers)
- **Stripe** handles payment processing via Checkout and Customer Portal
- **Feature flags** control access based on subscription plans

### Database Tables
- `subscription_plans` - Available plans (Free, Pro, Premium)
- `plan_features` - Features per plan with value types (boolean, number, string)
- `subscriptions` - User subscriptions with Stripe integration
- `stripe_customers` - Maps users to Stripe customer IDs

### Plans
| Plan | Features |
|------|----------|
| **Free** | 1 deck, 50 cards/deck, basic features |
| **Pro** ($3.99/mo) | Unlimited decks/cards, analytics, collaboration |
| **Max** ($9.99/mo) | Everything in Pro + AI card generation, AI study assistant |

### Feature Flags
- `max_decks` - Maximum number of decks (number)
- `max_cards_per_deck` - Maximum cards per deck (number)
- `ai_card_generation` - AI card generation access (boolean)
- `ai_assistant` - AI study assistant (boolean)
- `advanced_analytics` - Advanced analytics access (boolean)
- `export_import` - Export/import functionality (boolean)
- `collaboration` - Collaboration features (boolean)
- `priority_support` - Priority support access (boolean)

### API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/subscriptions` | GET | Get current subscription |
| `/api/subscriptions/plans` | GET | List available plans |
| `/api/subscriptions/checkout` | POST | Create Stripe checkout session |
| `/api/subscriptions/portal` | POST | Create Stripe customer portal session |
| `/api/subscriptions/cancel` | POST | Cancel subscription at period end |
| `/api/subscriptions/reactivate` | POST | Reactivate canceled subscription |
| `/api/subscriptions/features/[key]` | GET | Check feature access |
| `/api/subscriptions/config` | GET | Get Stripe publishable key |
| `/api/webhooks/stripe` | POST | Stripe webhook handler |

### Stripe Setup
1. Create products/prices in Stripe Dashboard
2. Set up webhook endpoint: `https://your-domain/api/webhooks/stripe`
3. Enable events: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`
4. Add price IDs to `BACKEND_SECRETS`

### Usage in Code
```typescript
// Check feature access
import { checkFeatureAccess, canCreateDeck, hasAICardGeneration } from '@/lib/subscriptions';

// Check a specific feature
const access = checkFeatureAccess(userId, 'ai_card_generation');
if (access.hasAccess) {
  // User has access
}

// Check deck limit
if (canCreateDeck(userId, currentDeckCount)) {
  // User can create more decks
}

// Check boolean feature
if (hasAICardGeneration(userId)) {
  // Show AI generation UI
}
```
