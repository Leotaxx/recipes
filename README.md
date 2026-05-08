# RecipeOps Enterprise Microservice CI/CD CA

This repository contains a continuous delivery implementation for a small recipe platform:

- `frontend`: Node/Express web UI for recipe management
- `catalog-api`: Node/Express REST API backed by PostgreSQL
- `recommendation-api`: Python/FastAPI service that calls `catalog-api`
- `postgres`: local data layer for development
- `infra/terraform`: Azure Container Apps, Azure Container Registry, PostgreSQL Flexible Server, Log Analytics, and Key Vault
- `.github/workflows`: CI and CD pipeline definitions
- `docs`: release management plan and presentation material

## Local Demo

```bash
docker compose up --build
```

Then open:

- Frontend: http://localhost:8080
- Catalog API health: http://localhost:3001/health
- Recommendation API health: http://localhost:3002/health

## Run Tests Locally

```bash
npm --prefix services/catalog-api test
python3 -m pytest services/recommendation-api/tests
```

## Terraform

```bash
terraform -chdir=infra/terraform init -backend=false
terraform -chdir=infra/terraform fmt -check -recursive
terraform -chdir=infra/terraform validate
```

For CI/CD remote state, bootstrap Azure Blob state storage once:

```bash
./scripts/register-azure-providers.sh
export TF_STATE_STORAGE_ACCOUNT="strecipeopstfstate123"
./scripts/bootstrap-terraform-state.sh
```

Cloud deployment is intentionally manual. Add the Azure and Terraform state secrets listed in `infra/terraform/README.md`, then run the `cd` workflow from GitHub Actions.

## Hetzner CD

The repository also includes a Hetzner VM deployment path in `deploy/hetzner`.

- `cloud-init.yaml` rebuilds a replacement VM with Docker and scheduled backups.
- `compose.yml` runs PostgreSQL plus blue/green service sets behind Nginx.
- `deploy.sh` starts the inactive color, health-checks it, then switches traffic.
- `rollback.sh` switches traffic back to the previous color.
- `backup.sh` and `restore.sh` handle PostgreSQL recovery.

The `deploy-hetzner` GitHub Actions workflow builds `linux/amd64` images, pushes them to GHCR, then deploys over SSH.

## Architecture

```mermaid
flowchart LR
  User[User] --> FE[frontend]
  FE --> Catalog[catalog-api]
  FE --> Recs[recommendation-api]
  Recs --> Catalog
  Catalog --> DB[(PostgreSQL)]
```
