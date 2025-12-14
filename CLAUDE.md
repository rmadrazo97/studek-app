# Studek App

## Live Site
https://studek.com

## Server
- **IP:** 155.138.237.103
- **Domain:** studek.com

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
| `BACKEND_SECRETS` | JSON object with env vars (must include `JWT_SECRET`) |
| `OPENAI_APIKEY` | OpenAI API key for AI deck generation (optional) |
| `RESEND_API_KEY` | Resend API key for transactional emails |
| `CRON_SECRET` | Secret token for notification cron job (optional) |
| `VAPID_PUBLIC_KEY` | VAPID public key for web push notifications (optional) |
| `VAPID_PRIVATE_KEY` | VAPID private key for web push notifications (optional) |
| `APNS_KEY_ID` | APNs Key ID for iOS push notifications (optional) |
| `APNS_TEAM_ID` | Apple Team ID for iOS push notifications (optional) |
| `APNS_KEY` | APNs .p8 key contents for iOS push (optional) |
| `APNS_BUNDLE_ID` | iOS app bundle ID (default: com.studek.app) |
| `FCM_SERVICE_ACCOUNT` | Firebase service account JSON for Android push (optional) |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID (optional, for Google login) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret (optional, for Google login) |
| `GH_CLIENT_ID` | GitHub OAuth Client ID (optional, for GitHub login) |
| `GH_CLIENT_SECRET` | GitHub OAuth Client Secret (optional, for GitHub login) |

**Important:** `BACKEND_SECRETS` must be a JSON object containing at minimum:
```json
{
  "JWT_SECRET": "your-secure-random-string-at-least-32-chars"
}
```
Without a consistent `JWT_SECRET`, tokens will be invalidated on each deployment.

## Domain Configuration (studek.com)

### Namecheap DNS Settings
In Namecheap dashboard → Domain List → Manage → Advanced DNS:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A Record | @ | 155.138.237.103 | Automatic |
| A Record | www | 155.138.237.103 | Automatic |

### Automatic SSL (Let's Encrypt)
SSL certificates are **automatically obtained** when containers start.
The Nginx container:
1. Starts with HTTP-only config
2. Requests SSL certificate from Let's Encrypt
3. Switches to HTTPS config
4. Auto-renews certificates every 12 hours

**Environment variables:**
- `DOMAIN` - Domain name (default: studek.com)
- `SSL_EMAIL` - Email for Let's Encrypt notifications
- `SKIP_SSL=true` - Disable SSL for local development

### Manual SSL Commands (if needed)
```bash
# Check certificate status
docker compose exec nginx certbot certificates

# Force certificate renewal
docker compose exec nginx certbot renew --force-renewal

# View nginx logs
docker compose logs -f nginx
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
- **Styling:** Tailwind CSS v4
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Algorithm:** FSRS (spaced repetition)
- **PWA:** Custom service worker with offline support
- **Mobile:** Capacitor for iOS/Android builds

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

**Features:**
- Console output (logs, errors, warnings)
- Network request inspector
- Element inspector
- Storage viewer (localStorage, sessionStorage, cookies)
- Resource viewer

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

2. Add to GitHub Secrets:
   - `VAPID_PUBLIC_KEY` - Also add as `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `VAPID_SUBJECT` (optional, defaults to `mailto:hello@studek.com`)

3. Add to `BACKEND_SECRETS` JSON:
   ```json
   {
     "JWT_SECRET": "...",
     "VAPID_PRIVATE_KEY": "your-vapid-private-key",
     "NEXT_PUBLIC_VAPID_PUBLIC_KEY": "your-vapid-public-key"
   }
   ```

### Setup Native Push Notifications (iOS/Android)

For native app push notifications, you need to configure APNs (iOS) and FCM (Android).

#### iOS (APNs)

1. In Apple Developer Portal:
   - Go to Certificates, Identifiers & Profiles
   - Create a Key for APNs (under Keys section)
   - Download the .p8 file
   - Note the Key ID and Team ID

2. Add to GitHub Secrets:
   - `APNS_KEY_ID` - The Key ID from Apple
   - `APNS_TEAM_ID` - Your Apple Team ID
   - `APNS_KEY` - Contents of the .p8 file (entire file contents)
   - `APNS_BUNDLE_ID` - Your app's bundle ID (default: com.studek.app)

3. In Xcode, enable Push Notifications capability:
   - Open project → Signing & Capabilities → + Capability → Push Notifications

#### Android (FCM)

1. In Firebase Console:
   - Create a project (or use existing)
   - Go to Project Settings → Service Accounts
   - Generate new private key (downloads JSON file)

2. Add to GitHub Secrets:
   - `FCM_SERVICE_ACCOUNT` - Entire contents of the JSON file

3. Add `google-services.json` to Android project:
   - Download from Firebase Console → Project Settings → Your apps → Android
   - Place in `android/app/google-services.json`

### Internal Cron Worker

The notification system uses an **internal cron worker** that runs alongside the Next.js app inside the Docker container. No external GitHub Actions required.

**Schedule:**
- **Hourly notifications** (`0 * * * *`): Study reminders, streak warnings (14:00-22:00 UTC)
- **Weekly summary** (`0 18 * * 0`): Sunday at 18:00 UTC

**How it works:**
1. The cron worker starts automatically with the app
2. It calls the `/api/notifications/trigger` endpoint internally
3. Logs are visible in Docker container logs

**View cron logs:**
```bash
docker compose logs -f app | grep -E "\[Cron\]|\[Notifications\]"
```

**Manual trigger (for testing):**
```bash
# From server:
curl -X POST \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  "https://studek.com/api/notifications/trigger?job=all"
```

**Job types:**
- `all` - Run all notification jobs
- `study_reminders` - Only study reminders
- `streak_warnings` - Only streak warnings
- `weekly_summary` - Only weekly summary

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/notifications/preferences` | GET | Get user notification preferences |
| `/api/notifications/preferences` | PUT | Update notification preferences |
| `/api/notifications/subscribe` | POST | Subscribe to web push notifications |
| `/api/notifications/subscribe` | DELETE | Unsubscribe from web push |
| `/api/notifications/subscribe` | GET | List user's web push subscriptions |
| `/api/notifications/native-token` | POST | Register native push token (APNs/FCM) |
| `/api/notifications/native-token` | DELETE | Unregister native push token |
| `/api/notifications/native-token` | GET | List user's native push tokens |
| `/api/notifications/vapid-key` | GET | Get VAPID public key (no auth) |
| `/api/notifications/trigger` | POST | Trigger notification job (cron only) |

### Database Tables
- `notification_preferences` - User notification settings
- `push_subscriptions` - Web push subscription data (VAPID)
- `native_push_tokens` - Native push tokens (APNs/FCM)
- `notification_logs` - Sent notification history
- `notification_schedule` - Scheduled notifications queue

## OAuth Authentication (Google & GitHub)

The app supports OAuth login/signup with Google and GitHub.

### Features
- **Google OAuth:** Login with Google account
- **GitHub OAuth:** Login with GitHub account
- **Account Linking:** Existing users can link OAuth accounts
- **Automatic Signup:** New users are created automatically on first OAuth login
- **Email Verification:** OAuth users are automatically verified (trust provider)

### Required GitHub Secrets for OAuth

Add these secrets to your GitHub repository:

| Secret | Description |
|--------|-------------|
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `GH_CLIENT_ID` | GitHub OAuth App Client ID (named `GH_` due to GitHub restrictions) |
| `GH_CLIENT_SECRET` | GitHub OAuth App Client Secret (named `GH_` due to GitHub restrictions) |

**Note:** GitHub doesn't allow secrets starting with `GITHUB_`, so we use `GH_` prefix instead.

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

### GitHub Secrets Setup

OAuth credentials are stored as **independent GitHub secrets** (not inside `BACKEND_SECRETS`):

| Secret | Value |
|--------|-------|
| `GOOGLE_CLIENT_ID` | Your Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth Client Secret |
| `GH_CLIENT_ID` | Your GitHub OAuth Client ID |
| `GH_CLIENT_SECRET` | Your GitHub OAuth Client Secret |

These are passed to the container as environment variables in the GitHub Actions workflow.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_CLIENT_ID` | Yes (for Google) | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Yes (for Google) | Google OAuth Client Secret |
| `GH_CLIENT_ID` | Yes (for GitHub) | GitHub OAuth App Client ID |
| `GH_CLIENT_SECRET` | Yes (for GitHub) | GitHub OAuth App Client Secret |
| `NEXT_PUBLIC_APP_URL` | Yes | Base URL for OAuth callbacks (e.g., `https://studek.com`) |

### OAuth API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/oauth?provider=google` | GET | Redirect to Google OAuth |
| `/api/auth/oauth?provider=github` | GET | Redirect to GitHub OAuth |
| `/api/auth/callback/google` | GET | Google OAuth callback handler |
| `/api/auth/callback/github` | GET | GitHub OAuth callback handler |

### Database Tables
- `oauth_accounts` - Stores OAuth account links (provider, provider_account_id, tokens)

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
