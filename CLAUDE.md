# Studek App

## Live Site
http://155.138.237.103

## Workflow
- Develop locally on `server` branch
- Push to remote, merge to `main` after approval
- Deploy by pulling `main` on server

## Server
```bash
ssh -i development-credentials/id_ed25519 root@155.138.237.103
```
- **Repo:** `/root/studek-app`
- **Stack:** Next.js + PM2 + Nginx

## Deploy
```bash
cd ~/studek-app/app && git pull origin main && npm install && npm run build && pm2 restart studek-app
```

## PM2
```bash
pm2 status | logs studek-app | restart studek-app
```
