# Demonstration Script

## 1. Local Microservice Proof

1. Run `docker compose up --build`.
2. Open `http://localhost:8080`.
3. Show that seeded recipes are loaded from PostgreSQL through `catalog-api`.
4. Add a recipe and refresh the recommendation panel.
5. Show backend health endpoints:

```bash
curl http://localhost:3001/health
curl http://localhost:3002/health
```

## 2. CI Proof

1. Open the GitHub Actions `ci` workflow.
2. Show independent tests for `catalog-api` and `recommendation-api`.
3. Show Docker builds for `frontend`, `catalog-api`, and `recommendation-api`.
4. Show Trivy vulnerability scans and SARIF upload to GitHub code scanning.
5. Explain that images are built as `linux/amd64` to avoid Apple Silicon image mismatch on the Linux server.

## 3. Hetzner CD Proof

1. Open the GitHub Actions `deploy-hetzner` workflow.
2. Show that the workflow is triggered by a push to `main` or manual dispatch.
3. Show image tags using the Git commit SHA.
4. Show images pushed to GHCR under `ghcr.io/leotaxx/recipes`.
5. Show the SSH deployment step copying files to `/opt/recipeops`.
6. Explain `deploy.sh`:
   - reads the current `ACTIVE_COLOR`
   - deploys the inactive color
   - runs health checks
   - writes the new Nginx config
   - force-recreates Nginx so the public port mapping is correct
7. Show the successful workflow run.

## 4. Public Runtime Proof

On the Hetzner server:

```bash
cd /opt/recipeops
cat .env
docker ps --format 'table {{.Names}}\t{{.Ports}}'
```

From a local machine:

```bash
curl http://SERVER_IP
curl http://SERVER_IP/api/catalog/health
curl http://SERVER_IP/api/catalog/recipes
curl http://SERVER_IP/api/recommendations/health
```

Open the app in the browser:

```text
http://SERVER_IP
```

If `APP_HTTP_PORT` is set to a non-default value such as `8080`, use:

```text
http://SERVER_IP:8080
```

## 5. Blue/Green and Rollback Proof

1. Show both blue and green containers with `docker ps`.
2. Show the active color in `/opt/recipeops/.env`.
3. Explain that the previous color remains running after deployment.
4. Roll back by switching Nginx to the previous color:

```bash
cd /opt/recipeops
./rollback.sh
```

The script defaults to the opposite of the current `ACTIVE_COLOR`. To force a specific target, run `./rollback.sh blue` or `./rollback.sh green`.

## 6. Backup and Recovery Proof

1. Show the backup cron entry from `deploy/hetzner/cloud-init.yaml`.
2. Run a manual backup:

```bash
cd /opt/recipeops
./backup.sh
ls -lh backups
```

3. Explain recovery:
   - rebuild VM with `cloud-init.yaml`
   - update `HETZNER_HOST`
   - rerun `deploy-hetzner`
   - copy backup into `/opt/recipeops/backups`
   - run `restore.sh`

## 7. Azure IaC Research Proof

1. Open `infra/terraform`.
2. Explain the Azure alternative: Container Apps, ACR, PostgreSQL Flexible Server, and Log Analytics.
3. Explain that Terraform validates in CI and can provision the cloud target when Azure OIDC/service-principal permissions are available.
4. State that the coursework demo uses Hetzner CD because the Azure tenant blocked application registration and federated credential setup.
