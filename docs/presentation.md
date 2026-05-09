# RecipeOps CI/CD Presentation

## Slide 1: Title

RecipeOps: automated CI/CD for a microservice recipe platform.

## Slide 2: Application Architecture

Frontend, catalog API, recommendation API, PostgreSQL, and Nginx are separated by clear responsibilities. The recommendation API calls the catalog API over HTTP, proving service-to-service communication.

## Slide 3: CI Pipeline

Pull requests run service tests, Docker image builds, Terraform validation, and Trivy scans. Scan results are uploaded to GitHub code scanning as SARIF.

## Slide 4: CD Pipeline

Main branch deployments use GitHub Actions to build `linux/amd64` images, tag them with the Git commit SHA, push them to GHCR, SSH to Hetzner, and run the release script.

## Slide 5: Infrastructure as Code

Hetzner provisioning uses `cloud-init.yaml` for Docker, firewall rules, `/opt/recipeops`, and scheduled backups. Runtime orchestration uses Docker Compose. Azure Terraform remains as the managed cloud IaC alternative.

## Slide 6: Blue/Green Release Strategy

The VM runs blue and green service sets behind Nginx. New releases start the inactive color, pass health checks, then switch traffic. The previous color remains running for immediate rollback.

## Slide 7: Change Management

Every release is linked to a Git commit SHA. All service images use the same version tag. Deployment secrets are stored in GitHub Actions. The gateway is force-recreated each release to avoid stale port mappings.

## Slide 8: Recovery

Backups are created with `pg_dump` and stored under `/opt/recipeops/backups`. Recovery uses a replacement VM, the same cloud-init configuration, a rerun of the CD workflow, and `restore.sh`.

## Slide 9: Evaluation

The chosen route balances cost, automation, rollback, and repeatability. Hetzner is simple and cost-predictable for the demo; Azure Container Apps remains the stronger elastic scaling option when identity permissions are available.

## Slide 10: Demo

Show local app, CI workflow, successful `deploy-hetzner` run, GHCR image tags, `docker ps`, public app URL, health endpoints, rollback script, and backup file.
