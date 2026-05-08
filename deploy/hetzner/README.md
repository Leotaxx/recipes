# Hetzner Deployment

This deployment path runs RecipeOps on a Hetzner VM with Docker Compose, Nginx, PostgreSQL, and blue/green service sets.

## Server Provisioning

Create a new Ubuntu server and use `cloud-init.yaml` as user data. It installs Docker, enables the firewall, creates `/opt/recipeops`, and schedules a daily PostgreSQL backup.

Required GitHub secrets for CD:

| Secret | Purpose |
|---|---|
| `HETZNER_HOST` | Server IP or DNS name |
| `HETZNER_USER` | SSH user, usually `root` or a deploy user |
| `HETZNER_SSH_KEY` | Private SSH key for deployment |
| `HETZNER_PORT` | SSH port, optional, defaults to `22` |
| `POSTGRES_PASSWORD` | Runtime database password |
| `APP_HTTP_PORT` | Optional public HTTP port, defaults to `80` |
| `GHCR_USERNAME` | Optional GHCR user, defaults to workflow actor |
| `GHCR_TOKEN` | Optional GHCR token if packages are private |

If deployment fails with `Bind for 0.0.0.0:80 failed: port is already allocated`, either stop the existing service using port 80 or set `APP_HTTP_PORT` to another value such as `8080` and access the app with `http://SERVER_IP:8080`.

## Release Flow

1. GitHub Actions runs tests.
2. GitHub Actions builds `linux/amd64` images for all services.
3. Images are pushed to GitHub Container Registry with the commit SHA and `latest`.
4. The deploy job SSHes to the server.
5. `deploy.sh` starts the inactive color (`blue` or `green`) with the new image tag.
6. The inactive color is health-checked.
7. Nginx is reloaded to route traffic to the new color.
8. The previous color remains running for immediate rollback.

## Rollback

Check the current active color:

```bash
ssh user@server 'cat /opt/recipeops/.env'
```

Switch traffic back:

```bash
ssh user@server 'cd /opt/recipeops && ACTIVE_COLOR=blue ./rollback.sh'
```

Use `green` instead if green is the known-good color.

## Backup and Restore

Backups run daily from cron and are stored in `/opt/recipeops/backups`.

Manual backup:

```bash
ssh user@server 'cd /opt/recipeops && ./backup.sh'
```

Restore:

```bash
ssh user@server 'cd /opt/recipeops && ./restore.sh backups/recipes-YYYYMMDDTHHMMSSZ.sql.gz'
```

For stronger recovery, copy backup files to object storage or another server with `rsync`, `rclone`, or a provider backup feature.

## Destroy and Replace

The orchestration layer is disposable:

1. Create a new Hetzner VM with `cloud-init.yaml`.
2. Point `HETZNER_HOST` at the new server.
3. Copy the latest backup into `/opt/recipeops/backups`.
4. Run the `deploy-hetzner` workflow.
5. Restore the backup if required.
6. Move DNS or public access to the new server.
