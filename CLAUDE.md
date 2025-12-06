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
