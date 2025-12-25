# Studek App

A flashcard learning application with AI-powered deck creation and FSRS spaced repetition algorithm.

## Live Site
https://studek.com

## Hosting
- **Platform:** Railway
- **Domain:** studek.com

## Codebase Structure

```
studek-app/
├── app/                          # Next.js application
│   ├── src/
│   │   ├── app/                  # App Router pages
│   │   │   ├── (dashboard)/      # Protected dashboard routes
│   │   │   │   ├── analytics/    # Learning analytics
│   │   │   │   ├── browser/      # Deck browser
│   │   │   │   ├── create/       # Deck creation studio
│   │   │   │   ├── dashboard/    # Main dashboard
│   │   │   │   ├── explore/      # Explore public decks
│   │   │   │   ├── help/         # Help center
│   │   │   │   ├── import/       # Import decks (APKG)
│   │   │   │   ├── library/      # User deck library
│   │   │   │   ├── profile/      # User profile
│   │   │   │   ├── settings/     # Settings & notifications
│   │   │   │   └── study/        # Study session
│   │   │   ├── api/              # API routes
│   │   │   │   ├── ai/           # AI generation endpoints
│   │   │   │   ├── analytics/    # Analytics data
│   │   │   │   ├── auth/         # Authentication (login, OAuth)
│   │   │   │   ├── billing/      # Stripe billing
│   │   │   │   ├── cards/        # Card CRUD
│   │   │   │   ├── decks/        # Deck CRUD + sharing
│   │   │   │   ├── notifications/# Push & email notifications
│   │   │   │   ├── reviews/      # Review session endpoints
│   │   │   │   └── ...
│   │   │   ├── login/            # Auth pages
│   │   │   ├── register/
│   │   │   └── shared/[code]/    # Shared deck view
│   │   ├── components/           # React components
│   │   │   ├── AddDeckSheet/     # Add deck modal
│   │   │   ├── analytics/        # Charts & heatmaps
│   │   │   ├── auth/             # Auth guards
│   │   │   ├── billing/          # Upgrade prompts
│   │   │   ├── capacitor/        # Native app provider
│   │   │   ├── creation-studio/  # Block editor for deck creation
│   │   │   ├── dashboard/        # Sidebar, nav, widgets
│   │   │   ├── data-grid/        # Virtualized data table
│   │   │   ├── decks/            # Deck management modals
│   │   │   ├── landing/          # Landing page sections
│   │   │   ├── pwa/              # PWA install prompt
│   │   │   ├── settings/         # Settings sections
│   │   │   ├── study/            # Review card, controls
│   │   │   └── ui/               # Base UI components
│   │   ├── hooks/                # Custom React hooks
│   │   │   ├── useAI.ts          # AI deck generation
│   │   │   ├── useCapacitor.ts   # Native platform detection
│   │   │   ├── useDecks.ts       # Deck data fetching
│   │   │   └── useNativePush.ts  # Native push notifications
│   │   └── lib/                  # Core libraries
│   │       ├── ai/               # OpenAI integration
│   │       │   ├── extractors/   # URL, PDF, YouTube extractors
│   │       │   ├── mcp/          # Tool schemas for OpenAI
│   │       │   └── prompts/      # System & template prompts
│   │       ├── analytics/        # Analytics calculations
│   │       ├── api/              # API client & error handling
│   │       ├── apkg/             # Anki import parser
│   │       ├── auth/             # JWT auth, OAuth, RBAC
│   │       ├── billing/          # Stripe, plan limits
│   │       ├── db/               # SQLite database
│   │       │   └── services/     # Data access layer
│   │       ├── email/            # Resend email templates
│   │       ├── fsrs/             # FSRS v5 spaced repetition
│   │       ├── gamification/     # XP, achievements, streaks
│   │       └── notifications/    # Push (VAPID, APNs, FCM)
│   ├── migrations/               # SQLite migrations
│   └── public/                   # Static assets, icons, SW
├── railway.toml                  # Railway deployment config
├── docker-compose.yml            # Local Docker config (optional)
├── docker-compose.dev.yml        # Development overrides
└── .github/workflows/build.yml   # CI/CD pipeline
```

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Database | SQLite with better-sqlite3 |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| Icons | Lucide React |
| Auth | JWT tokens (access + refresh) |
| OAuth | Google, GitHub |
| Payments | Stripe (subscriptions) |
| Email | Resend |
| Push | Web Push (VAPID), APNs (iOS), FCM (Android) |
| AI | OpenAI GPT-4o-mini |
| Algorithm | FSRS v5 (spaced repetition) |
| PWA | Custom service worker |
| Mobile | Capacitor 8 (iOS/Android) |
| Hosting | Railway |

## Deployment Workflow

### Automatic Deployment via GitHub Actions
On push to `main`:
1. Build & lint the app
2. Deploy to Railway using Railway CLI

### Railway Configuration
The `railway.toml` file configures the deployment:
- Uses the Dockerfile in `app/` directory
- Health check at `/api/health`
- Automatic restarts on failure

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `RAILWAY_TOKEN` | Railway API token (from Railway dashboard → Account Settings → Tokens) |
| `RAILWAY_SERVICE_ID` | Railway service ID (from service settings URL or CLI) |

### Railway Environment Variables

Configure these in the Railway dashboard (Service → Variables):

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Secret for JWT tokens (min 32 chars) |
| `DATABASE_PATH` | SQLite database path (default: `/app/data/studek.db`) |
| `NEXT_PUBLIC_APP_URL` | App URL (e.g., `https://studek.com`) |
| `OPENAI_APIKEY` | OpenAI API key for AI deck generation |
| `RESEND_API_KEY` | Resend API key for transactional emails |
| `STRIPE_SECRET_KEY` | Stripe secret key for billing |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PRICE_PREMIUM` | Stripe Price ID for Premium plan |
| `STRIPE_PRICE_PRO` | Stripe Price ID for Pro plan |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `GH_CLIENT_ID` | GitHub OAuth Client ID |
| `GH_CLIENT_SECRET` | GitHub OAuth Client Secret |
| `VAPID_PUBLIC_KEY` | VAPID public key for web push |
| `VAPID_PRIVATE_KEY` | VAPID private key for web push |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | VAPID public key (client-side) |
| `CRON_SECRET` | Secret for notification cron endpoint |
| `APNS_KEY_ID` | APNs Key ID for iOS push (optional) |
| `APNS_TEAM_ID` | Apple Team ID for iOS push (optional) |
| `APNS_KEY` | APNs .p8 key contents (optional) |
| `APNS_BUNDLE_ID` | iOS app bundle ID (optional) |
| `FCM_SERVICE_ACCOUNT` | Firebase service account JSON (optional) |

### Railway Setup Steps

1. **Create Railway Project:**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli

   # Login to Railway
   railway login

   # Link to existing project or create new one
   railway link
   ```

2. **Add Persistent Volume for SQLite:**
   - Go to Railway dashboard → Service → Settings → Volumes
   - Add volume mounted at `/app/data`
   - This persists the SQLite database across deployments

3. **Configure Custom Domain:**
   - Go to Service → Settings → Networking → Custom Domain
   - Add `studek.com`
   - Update DNS records:
     | Type | Host | Value |
     |------|------|-------|
     | CNAME | @ | your-service.up.railway.app |
     | CNAME | www | your-service.up.railway.app |

4. **Get Service ID for GitHub Actions:**
   ```bash
   # Using Railway CLI
   railway status
   # Or from the URL: https://railway.app/project/xxx/service/SERVICE_ID
   ```

5. **Generate API Token:**
   - Go to Railway dashboard → Account Settings → Tokens
   - Create new token with appropriate permissions
   - Add as `RAILWAY_TOKEN` secret in GitHub

### Manual Deployment
```bash
# Deploy from local machine
railway up

# View logs
railway logs

# Open Railway dashboard
railway open
```

## Database Schema

### Core Tables
- `users` - User accounts with plan assignments
- `decks` - Flashcard decks (supports hierarchy, sharing, AI-generated flag)
- `cards` - Flashcards (basic, cloze, image-occlusion types)
- `card_fsrs` - FSRS spaced repetition state per card
- `review_logs` - Review history for analytics
- `study_sessions` - Study session tracking

### Gamification Tables
- `user_stats` - XP, level, streaks
- `xp_transactions` - XP earning history
- `achievements` - Achievement definitions
- `user_achievements` - Unlocked achievements

### Monetization Tables
- `plans` - Subscription plans (Free, Premium, Pro)
- `user_subscriptions` - Stripe subscription records

### Notification Tables
- `notification_preferences` - User notification settings
- `push_subscriptions` - Web push subscriptions (VAPID)
- `native_push_tokens` - APNs/FCM tokens
- `notification_logs` - Sent notification history

### Auth Tables
- `oauth_accounts` - OAuth provider accounts (Google, GitHub)
- `password_reset_tokens` - Password reset tokens
- `email_verification_tokens` - Email verification tokens

## Local Development

```bash
cd app && npm run dev
```

Or with Docker:
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

### Database Commands
```bash
cd app

# Run migrations
npm run db:migrate

# Rollback last migration
npm run db:rollback

# Check migration status
npm run db:status

# Create new migration
npm run db:create migration_name

# Seed admin user
npm run db:seed

# Seed subscription plans
npm run db:seed:plans
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

### Code Conventions
- Use TypeScript strict mode
- Prefer functional components with hooks
- Use Zod for runtime validation (API routes)
- Use `better-sqlite3` synchronous API (no async/await for DB)
- Keep API routes thin; business logic in `lib/db/services/`

## Key Features

### FSRS Spaced Repetition (src/lib/fsrs/)
Implements FSRS v5 algorithm with:
- Power law forgetting curve: R(t) = (1 + t/9S)^(-0.5)
- 19 tunable weights for personalization
- Learning steps: 1m → 10m → graduate
- Interval fuzzing to prevent review clumping
- Card states: new, learning, review, relearning
- Rating options: Again (1), Hard (2), Good (3), Easy (4)

### AI Deck Generation (src/lib/ai/)
OpenAI-powered deck creation:
- Generate decks from natural language prompts
- Extract content from URLs, PDFs, YouTube videos
- MCP tools for structured output (deck/card schemas)
- System prompts optimized for SRS card design

### Stripe Billing (src/lib/billing/)
Three-tier subscription model:
- **Free**: 2 decks, 3 sessions/deck, 1 public deck, 0 AI decks
- **Premium** ($3.99/mo): Unlimited decks/sessions, 2 AI decks
- **Pro** ($5.99/mo): Unlimited everything including AI decks

Plan limits enforced via `assertDeckCreationAllowed()`, `assertStudySessionAllowed()`.

### Gamification (src/lib/gamification/)
- XP system with level progression
- Daily streaks with streak freezes
- Achievement system
- Leaderboard

## PWA Features

The app is a Progressive Web App with:
- **Offline Support:** Service worker caches pages and API responses
- **Install Prompt:** Smart install banner for mobile and desktop
- **Push Ready:** Infrastructure for push notifications
- **Background Sync:** Queue for offline actions

### PWA Files
- `public/manifest.json` - Web app manifest
- `public/sw.js` - Service worker
- `public/icons/` - App icons (SVG sources)
- `src/components/pwa/` - PWA React components

### Generate PNG Icons
```bash
npm run generate:icons
```
Requires `sharp`: `npm install sharp --save-dev`

### Mobile Debug Console (Eruda)

For debugging on mobile devices (iPhone, Android), the app includes an on-device debug console using [Eruda](https://github.com/liriliri/eruda).

**Enable debug console:**
- Add `?debug=true` to any URL (persists to localStorage)
- Or run in browser console: `enableDebug()`
- Or triple-tap the bottom-right corner of the screen (within 1 second)

**Disable debug console:**
- Add `?debug=false` to any URL
- Or run in browser console: `disableDebug()`
- Or triple-tap again to toggle off

## Mobile App (Capacitor)

Build native iOS/Android apps from the PWA. See `CAPACITOR.md` for full guide.

### Quick Start
```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android

# Add platforms
npx cap add ios
npx cap add android

# Build and sync
npm run capacitor:build

# Open in IDE
npm run ios      # Opens Xcode
npm run android  # Opens Android Studio
```

### Capacitor Scripts
| Script | Description |
|--------|-------------|
| `npm run build:static` | Build static export for Capacitor |
| `npm run capacitor:sync` | Sync web assets to native |
| `npm run capacitor:build` | Build + sync |
| `npm run ios` | Open iOS project in Xcode |
| `npm run android` | Open Android project in Android Studio |

## Notifications System

The app includes a Duolingo-style notification system for study reminders.

### Features
- **Email Notifications:** Daily study reminders, streak warnings, weekly summaries
- **Web Push Notifications:** Real-time alerts via VAPID for browsers and PWA
- **Native Push Notifications:** APNs for iOS, FCM for Android native apps
- **Customizable:** Users can set preferred reminder times, quiet hours, and notification types
- **Smart Scheduling:** Notifications only sent when cards are due or streak is at risk

### Notification Types
| Type | Email | Push | Description |
|------|-------|------|-------------|
| Study Reminder | Yes | Yes | Daily reminder to study flashcards |
| Streak Warning | Yes | Yes | Alert when streak is about to expire |
| Weekly Summary | Yes | No | Weekly progress report (Sundays) |
| Cards Due | No | Yes | Notification when cards are ready for review |
| Achievement | Yes | No | When user unlocks an achievement |

### Setup Push Notifications

1. Generate VAPID keys:
   ```bash
   npx web-push generate-vapid-keys
   ```

2. Add to Railway environment variables:
   - `VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (same as public key)

### Internal Cron Worker

The notification system uses an **internal cron worker** that runs alongside the Next.js app. No external services required.

**Schedule:**
- **Hourly notifications** (`0 * * * *`): Study reminders, streak warnings (14:00-22:00 UTC)
- **Weekly summary** (`0 18 * * 0`): Sunday at 18:00 UTC

**View logs in Railway:**
```bash
railway logs
```

## API Reference

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Create new account |
| `/api/auth/login` | POST | Login with email/password |
| `/api/auth/logout` | POST | Logout (invalidate token) |
| `/api/auth/refresh` | POST | Refresh access token |
| `/api/auth/me` | GET | Get current user |
| `/api/auth/oauth?provider=google\|github` | GET | OAuth redirect |
| `/api/auth/callback/google` | GET | Google OAuth callback |
| `/api/auth/callback/github` | GET | GitHub OAuth callback |
| `/api/auth/forgot-password` | POST | Request password reset |
| `/api/auth/reset-password` | POST | Reset password with token |
| `/api/auth/verify-email` | GET | Verify email with token |

### Decks & Cards
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/decks` | GET | List user's decks |
| `/api/decks` | POST | Create new deck |
| `/api/decks/[id]` | GET | Get deck by ID |
| `/api/decks/[id]` | PUT | Update deck |
| `/api/decks/[id]` | DELETE | Delete deck |
| `/api/decks/[id]/cards` | GET | List cards in deck |
| `/api/decks/[id]/cards` | POST | Add cards to deck |
| `/api/decks/[id]/share` | POST | Generate share link |
| `/api/decks/shared/[code]` | GET | Get shared deck by code |
| `/api/cards/[id]` | PUT | Update card |
| `/api/cards/[id]` | DELETE | Delete card |

### Study Sessions
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sessions` | POST | Start study session |
| `/api/reviews` | POST | Submit card review |
| `/api/reviews/session` | GET | Get session summary |
| `/api/fsrs` | GET | Get due cards for deck |

### AI Generation
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/generate` | POST | Generate deck from prompt |
| `/api/ai/extract/url` | POST | Extract content from URL |
| `/api/ai/extract/pdf` | POST | Extract content from PDF |
| `/api/ai/extract/youtube` | POST | Extract from YouTube |
| `/api/ai/transcribe` | POST | Transcribe audio |

### Billing
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/billing/plans` | GET | List available plans |
| `/api/billing/checkout` | POST | Create Stripe checkout session |
| `/api/billing/portal` | POST | Create billing portal session |
| `/api/billing/webhook` | POST | Stripe webhook handler |

### Notifications
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/notifications/preferences` | GET/PUT | Get/update notification settings |
| `/api/notifications/subscribe` | POST/DELETE | Web push subscription |
| `/api/notifications/native-token` | POST/DELETE | Native push token |
| `/api/notifications/vapid-key` | GET | Get VAPID public key |
| `/api/notifications/trigger` | POST | Trigger notification job (cron) |

## OAuth Authentication (Google & GitHub)

The app supports OAuth login/signup with Google and GitHub.

### Features
- **Google OAuth:** Login with Google account
- **GitHub OAuth:** Login with GitHub account
- **Account Linking:** Existing users can link OAuth accounts
- **Automatic Signup:** New users are created automatically on first OAuth login
- **Email Verification:** OAuth users are automatically verified (trust provider)

### Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client IDs**
5. Configure the consent screen:
   - **App name:** Studek
   - **User support email:** Your email
   - **Authorized domains:** `studek.com`
6. Create OAuth Client ID:
   - **Application type:** Web application
   - **Name:** Studek Web App
   - **Authorized JavaScript origins:**
     - `https://studek.com`
     - `http://localhost:3000` (for local dev)
   - **Authorized redirect URIs:**
     - `https://studek.com/api/auth/callback/google`
     - `http://localhost:3000/api/auth/callback/google` (for local dev)
7. Copy the **Client ID** and **Client Secret**

### GitHub OAuth App Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** → **New OAuth App**
3. Fill in the application details:
   - **Application name:** Studek
   - **Homepage URL:** `https://studek.com`
   - **Authorization callback URL:** `https://studek.com/api/auth/callback/github`
4. Click **Register application**
5. Copy the **Client ID**
6. Generate a new **Client Secret** and copy it

### How OAuth Flow Works

1. User clicks Google/GitHub button on login/register page
2. Browser redirects to `/api/auth/oauth?provider=google|github`
3. Server redirects to provider's OAuth authorization page
4. User authorizes the app
5. Provider redirects back to `/api/auth/callback/google|github` with auth code
6. Server exchanges code for tokens and fetches user info
7. Server creates/links user account and generates JWT tokens
8. Browser redirects to `/auth/callback` with tokens in URL fragment
9. Client stores tokens and redirects to dashboard

### Local Development

For local development, create a `.env.local` file:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-dev-client-id
GOOGLE_CLIENT_SECRET=your-dev-client-secret
GH_CLIENT_ID=your-dev-client-id
GH_CLIENT_SECRET=your-dev-client-secret
```

Note: You'll need separate OAuth apps for development with `localhost:3000` callbacks.
