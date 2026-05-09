# Demonstration Notes

## Aim

Show that RecipeOps is not just a local Docker Compose application. It has a repeatable CI/CD release process, immutable images, automated vulnerability scanning, a live deployed microservice stack, blue/green release switching, rollback, and database backup/recovery.

## Opening Statement

RecipeOps is a microservice recipe management platform. It has a Node.js frontend, a Node.js catalog API, a Python recommendation API, and PostgreSQL as the data layer. The recommendation API calls the catalog API over HTTP, so the services communicate through explicit service contracts rather than sharing all logic in one monolith.

## What To Show First

Open the application in the browser:

```text
http://SERVER_IP
```

Show:

- Seeded recipe data.
- The frontend calling backend APIs.
- Recommendation output.
- A new recipe being added.

Then run:

```bash
curl http://SERVER_IP/api/catalog/health
curl http://SERVER_IP/api/catalog/recipes
curl http://SERVER_IP/api/recommendations/health
```

Key point to say: the public entry point is Nginx. Nginx routes frontend traffic and API traffic to the active blue or green service set.

## CI Evidence

Open GitHub Actions and show the `ci` workflow.

Point out:

- `catalog-api` tests run independently.
- `recommendation-api` tests run independently.
- Each service has its own Dockerfile.
- Images are scanned with Trivy.
- SARIF results are uploaded to GitHub code scanning.

Key point to say: CI gives a repeatable quality gate before a release reaches the server.

## CD Evidence

Open GitHub Actions and show the successful `deploy-hetzner` workflow.

Point out:

- Images are built for `linux/amd64`.
- Images are tagged with the Git commit SHA.
- Images are pushed to GHCR.
- GitHub Actions connects to Hetzner over SSH.
- Deployment files are copied to `/opt/recipeops`.
- `deploy.sh` performs the blue/green release.

Key point to say: the same commit SHA is used across all service images, so the release version is unified and traceable.

## Server Evidence

On the Hetzner server, run:

```bash
cd /opt/recipeops
cat .env
docker ps --format 'table {{.Names}}\t{{.Ports}}'
```

Explain:

- `ACTIVE_COLOR` shows which color is live.
- `BLUE_TAG` and `GREEN_TAG` show deployed image versions.
- Both blue and green service sets can exist at the same time.
- Nginx exposes the public port.
- PostgreSQL is internal and not exposed publicly.

## Blue/Green Explanation

Say:

The deployment does not replace the live containers immediately. It starts the inactive color first, runs health checks, then rewrites the Nginx config to send traffic to the new color. The previous color is left running, so rollback is fast.

Health checks in deployment:

- Catalog API `/health`.
- Catalog API `/recipes`, proving seed data and database access.
- Recommendation API `/health`.
- Frontend HTTP response.

## Rollback Proof

Show the rollback command:

```bash
cd /opt/recipeops
./rollback.sh
```

The script switches to the opposite of the current `ACTIVE_COLOR`. Use `./rollback.sh blue` or `./rollback.sh green` when you want to force a specific target.

Key point to say: rollback is a traffic switch, not a rebuild. This is faster and safer.

## Backup and Recovery Proof

Show:

```bash
cd /opt/recipeops
./backup.sh
ls -lh backups
```

If backup permissions fail after switching from root to a `deploy` user, run:

```bash
sudo chown -R deploy:deploy /opt/recipeops/backups
sudo chmod 775 /opt/recipeops/backups
```

Explain:

- Backups are PostgreSQL dumps.
- `cloud-init.yaml` installs a daily cron backup.
- Restore is handled by `restore.sh`.
- If the VM is lost, recreate it with cloud-init, rerun CD, copy the backup, and restore.

## Azure IaC Note

Say:

The repository also contains Terraform for Azure Container Apps, ACR, PostgreSQL Flexible Server, and Log Analytics. Azure is kept as the managed cloud IaC option. The demonstrated CD route uses Hetzner because the Azure tenant blocked application registration and federated credentials, which prevented fully automated GitHub OIDC deployment without administrator access.

## Closing Statement

This project demonstrates the required release management process: independent services, a data layer, automated CI, image scanning, immutable release artifacts, CD to a live server, blue/green deployment, rollback, and backup/recovery. The system can be destroyed and replaced because provisioning, runtime configuration, and release orchestration are stored as code.
