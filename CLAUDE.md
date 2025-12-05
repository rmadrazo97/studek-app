# Development Guidelines

## Branch Workflow

- **main**: Production-ready code. Only merged after approval.
- **server**: Branch synced to the remote server for deployment.

### Workflow

1. **Local development**: All development happens locally on the `server` branch for resources and simplicity
2. Changes are committed and pushed to the remote repository
3. After approval, changes are merged into `main`
4. The server pulls from `main` to deploy approved changes

### Daily Workflow

1. Pull latest changes before starting work:
   ```bash
   git pull origin server
   ```
2. Develop and test locally
3. Commit frequently with clear messages
4. Push changes to remote:
   ```bash
   git push origin server
   ```
5. After approval, merge to `main` and sync server:
   ```bash
   # On server
   cd ~/studek-app && git pull origin main
   ```

## Server Access

- **IP:** 155.138.237.103
- **User:** root
- **SSH:** Use keys in `development-credentials/`

```bash
ssh -i development-credentials/id_ed25519 root@155.138.237.103
```

## Repository Location on Server

`/root/studek-app`

## Deployment

The app is served publicly at: **http://155.138.237.103**

### Stack
- **Next.js** - React framework
- **PM2** - Process manager
- **Nginx** - Reverse proxy

### Deploy Commands

First-time setup or full redeploy:
```bash
cd ~/studek-app && chmod +x server/deploy.sh && ./server/deploy.sh
```

Quick restart (after pulling changes):
```bash
cd ~/studek-app/app && npm install && npm run build && pm2 restart studek-app
```

### Useful PM2 Commands
```bash
pm2 status          # Check app status
pm2 logs studek-app # View logs
pm2 restart studek-app # Restart app
```
