# Demonstration Script

## 1. Local microservice proof

1. Run `docker compose up --build`.
2. Open `http://localhost:8080`.
3. Show seeded recipes loaded from PostgreSQL through `catalog-api`.
4. Add a recipe and refresh the recommendation panel.
5. Open `/health` on both APIs.

## 2. CI proof

1. Open the GitHub Actions `ci` workflow.
2. Show service tests running independently.
3. Show Docker image builds for all services.
4. Show Trivy vulnerability scanning and SARIF upload.

## 3. CD proof

1. Open the GitHub Actions `cd` workflow.
2. Show remote Terraform state configured from `TF_STATE_*` secrets.
3. Explain Terraform provisioning of ACR, Container Apps, PostgreSQL, and Log Analytics.
4. Show the saved Terraform plan and apply step.
5. Show image push to ACR.
6. Show `az containerapp update` creating a new revision.
7. Explain blue/green support through Container Apps multiple revision mode and traffic weights.

## 3b. Hetzner CD proof

1. Open the GitHub Actions `deploy-hetzner` workflow.
2. Show image builds tagged with the Git commit SHA and pushed to GHCR.
3. Show SSH deployment to `/opt/recipeops`.
4. Explain `deploy.sh`: start inactive color, health-check it, then reload Nginx.
5. Show `rollback.sh` switching traffic back to the previous color.
6. Show `backup.sh` and the daily cron entry from `cloud-init.yaml`.

## 4. Recovery proof

1. Explain that infrastructure can be destroyed and recreated with Terraform.
2. Explain PostgreSQL backup retention and restore path.
3. Show rollback by moving Container Apps traffic back to the previous healthy revision.
