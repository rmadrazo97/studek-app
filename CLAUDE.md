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
