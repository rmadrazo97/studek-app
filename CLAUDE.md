# Development Guidelines

## Branch Workflow

- **main**: Production-ready code. Only merged after approval.
- **server**: Development branch for server work. All changes are made here first.

### Workflow

1. All development happens on the `server` branch
2. Changes are reviewed and approved before merging to `main`
3. Always pull latest changes before starting work:
   ```bash
   git pull origin server
   ```
4. Commit frequently with clear messages
5. Push changes to remote:
   ```bash
   git push origin server
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
