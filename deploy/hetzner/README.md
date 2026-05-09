# Hetzner Deployment Runbook

This deployment path runs RecipeOps on a Hetzner Ubuntu VM with Docker Compose, Nginx, PostgreSQL, and blue/green service sets.

## Server Provisioning

Create an Ubuntu server and use `cloud-init.yaml` as user data. It installs Docker, enables basic firewall rules, creates `/opt/recipeops`, and schedules a daily PostgreSQL backup.

For day-to-day deployment, prefer a non-root `deploy` user:

```bash
adduser --disabled-password --gecos "" deploy
usermod -aG docker deploy
mkdir -p /home/deploy/.ssh
cp /root/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
mkdir -p /opt/recipeops
chown -R deploy:deploy /opt/recipeops
```

Test access:

```bash
ssh deploy@SERVER_IP
docker ps
```

## GitHub Secrets

Required GitHub Actions secrets:

| Secret | Purpose |
|---|---|
| `HETZNER_HOST` | Server IP or DNS name |
| `HETZNER_USER` | SSH user, preferably `deploy` |
| `HETZNER_SSH_KEY` | Private SSH key for deployment |
| `POSTGRES_PASSWORD` | Runtime database password |

Optional secrets:

| Secret | Purpose |
|---|---|
| `HETZNER_PORT` | SSH port, defaults to `22` |
| `APP_HTTP_PORT` | Public HTTP port, defaults to `80` |
| `GHCR_USERNAME` | GHCR user, defaults to workflow actor |
| `GHCR_TOKEN` | GHCR token if packages are private |

## Release Flow

1. GitHub Actions runs tests.
2. GitHub Actions builds `linux/amd64` images for all services.
3. Images are pushed to GHCR with the Git commit SHA and `latest`.
4. The deploy job SSHes to the server.
5. Deployment files are copied to `/opt/recipeops`.
6. `deploy.sh` starts the inactive color, either `blue` or `green`.
7. The inactive color is health-checked.
8. Nginx is configured for the new active color.
9. Nginx is force-recreated to apply the correct public port mapping.
10. The previous color remains running for rollback.

## Runtime Checks

On the server:

```bash
cd /opt/recipeops
cat .env
docker ps --format 'table {{.Names}}\t{{.Ports}}'
docker compose logs --tail=100
```

Expected public Nginx mapping:

```text
recipeops-nginx-1   0.0.0.0:80->80/tcp
```

If `APP_HTTP_PORT=8080`, expect:

```text
recipeops-nginx-1   0.0.0.0:8080->80/tcp
```

Public tests:

```bash
curl http://SERVER_IP
curl http://SERVER_IP/api/catalog/health
curl http://SERVER_IP/api/catalog/recipes
curl http://SERVER_IP/api/recommendations/health
```

Do not use `/health` as the main public backend check, because the gateway routes `/health` to the frontend. Use `/api/catalog/health` and `/api/recommendations/health`.

## Port 80 Troubleshooting

If deployment fails with:

```text
Bind for 0.0.0.0:80 failed: port is already allocated
```

find the existing owner:

```bash
docker ps --filter publish=80 --format 'table {{.ID}}\t{{.Names}}\t{{.Image}}\t{{.Ports}}'
sudo ss -ltnp 'sport = :80'
```

Stop an old container if required:

```bash
docker stop CONTAINER_NAME
docker rm CONTAINER_NAME
```

Alternatively set the GitHub secret:

```text
APP_HTTP_PORT=8080
```

and access:

```text
http://SERVER_IP:8080
```

## Rollback

Check the current active color:

```bash
ssh deploy@SERVER_IP 'cat /opt/recipeops/.env'
```

Switch traffic back:

```bash
ssh deploy@SERVER_IP 'cd /opt/recipeops && ./rollback.sh'
```

By default, `rollback.sh` switches to the opposite of the current `ACTIVE_COLOR`. To force a specific target:

```bash
ssh deploy@SERVER_IP 'cd /opt/recipeops && ./rollback.sh blue'
ssh deploy@SERVER_IP 'cd /opt/recipeops && ./rollback.sh green'
```

## Backup and Restore

Backups run daily from cron and are stored in `/opt/recipeops/backups`.

Manual backup:

```bash
ssh deploy@SERVER_IP 'cd /opt/recipeops && ./backup.sh'
```

Restore:

```bash
ssh deploy@SERVER_IP 'cd /opt/recipeops && ./restore.sh backups/recipes-YYYYMMDDTHHMMSSZ.sql.gz'
```

For stronger recovery, copy backup files off the VM with snapshots, `rsync`, `rclone`, or object storage.

## Destroy and Replace

The orchestration layer is disposable:

1. Create a new Hetzner VM with `cloud-init.yaml`.
2. Create the `deploy` user and install the SSH key.
3. Point `HETZNER_HOST` at the new server.
4. Run the `deploy-hetzner` workflow.
5. Copy the latest backup into `/opt/recipeops/backups`.
6. Restore the backup if required.
7. Move DNS or public access to the new server.
