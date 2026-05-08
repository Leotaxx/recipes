# Release Management Plan: RecipeOps Microservice CI/CD

## Executive Summary

RecipeOps is a service-oriented recipe management application with two communicating backend services and a dedicated data layer. The implementation uses a Node.js frontend, a Node.js catalog API, a Python FastAPI recommendation API, and PostgreSQL. The release management plan supports two deployment targets: Azure Container Apps through Terraform and a Hetzner VM through Docker Compose. The Hetzner path is the working CD route when Azure tenant policy blocks GitHub OIDC setup.

The plan prioritises repeatability, automated change management, and recoverability. Infrastructure and server configuration are declared as code, each service is independently testable and deployable, images are scanned before release, and the runtime supports blue/green rollback.

## Application Architecture

The system has four runtime components:

| Component | Technology | Responsibility |
|---|---|---|
| Frontend | Node.js / Express | User interface and API proxy |
| Catalog API | Node.js / Express | Recipe CRUD and validation |
| Recommendation API | Python / FastAPI | Calls catalog API and ranks recipes |
| Data layer | PostgreSQL | Persistent recipe storage |

The recommendation API depends on the catalog API rather than connecting directly to the database. This keeps the data ownership boundary clear and avoids coupling every service to the same schema.

## CI/CD Strategy

The project uses GitHub Actions because it integrates directly with repository events and gives a consistent execution environment for tests, image builds, scans, and deployment. The pipeline has three workflows:

| Workflow | Trigger | Purpose |
|---|---|---|
| `ci.yml` | pull request and main branch push | Run service tests, build images, scan images |
| `cd.yml` | manual dispatch | Provision Azure resources and deploy new revisions |
| `deploy-hetzner.yml` | main branch push or manual dispatch | Build images, push to GHCR, and deploy to Hetzner over SSH |

The CI workflow scans each image for high and critical vulnerabilities and uploads the results to GitHub code scanning. This keeps vulnerability checks visible without blocking the whole pipeline on upstream base-image findings that need separate triage.

## Infrastructure as Code

Terraform provisions:

- Azure Resource Group
- Azure Container Registry
- Azure Container Apps Environment
- Three Azure Container Apps
- Azure Database for PostgreSQL Flexible Server
- Log Analytics Workspace
- PostgreSQL firewall rule for Azure services

Terraform state is stored remotely in Azure Blob Storage during CI/CD. A bootstrap script creates the state resource group, storage account, and container once. The CD workflow then generates `backend.tf` from GitHub secrets and runs `terraform init` against that shared backend. This prevents each pipeline run from creating a disconnected copy of the environment.

The Hetzner deployment uses `deploy/hetzner/cloud-init.yaml` to rebuild a VM consistently. It installs Docker, enables a firewall, creates `/opt/recipeops`, and configures a daily PostgreSQL backup cron job. Runtime orchestration is handled by Docker Compose in `deploy/hetzner/compose.yml`.

## Deployment Strategy

The chosen deployment strategy is blue/green. On Azure this maps to Container Apps multiple revision mode. On Hetzner this maps to two Docker Compose color sets, `blue` and `green`, behind Nginx.

Each deployment builds immutable images tagged with the Git commit SHA. The Hetzner deployment starts the inactive color, health-checks the frontend, catalog API, recommendation API, and seeded catalog endpoint, then reloads Nginx to switch traffic. Rollback is achieved by switching Nginx back to the previous color. This avoids rebuilding an old artifact and keeps rollback fast.

## Change Management

Changes follow this sequence:

1. Developer opens a pull request.
2. CI runs tests, builds images, and scans images.
3. Review approval is required before merge.
4. Merge to `main` builds `linux/amd64` images for all services.
5. Images are tagged with the same Git commit SHA and pushed to GHCR.
6. The Hetzner deploy job starts the inactive color and runs health checks.
7. Traffic is switched only after the candidate color passes checks.
8. Logs and health endpoints are checked.

This sequence reduces configuration drift because infrastructure changes and application changes are both tracked through version control.

Terraform quality checks also run in CI using `terraform init -backend=false`, `terraform fmt -check`, and `terraform validate`. The provider lock file includes checksums for local macOS development and GitHub Actions Linux runners.

The project uses a monorepo rather than one repository per service. This keeps the coursework deployment coherent because the frontend, APIs, Dockerfiles, infrastructure, and report evolve together. Each service still has an independent Dockerfile and test command, so the pipeline can treat services independently inside one repository.

Tool and version consistency is managed through pinned Docker base images, `package-lock.json`, `requirements.txt`, Terraform provider locks, and GitHub-hosted Linux runners. Production images are always built for `linux/amd64` so Apple Silicon local builds do not produce incompatible server images.

## Evaluation Criteria

### Performance

Container Apps provides low operational overhead and supports horizontal scaling. The Hetzner VM provides predictable dedicated resources for a small workload. PostgreSQL runs locally on the VM in the Hetzner path, which reduces latency but shifts operational responsibility to the deployment scripts. The recommendation service calls the catalog API, adding a network hop, but the separation is intentional to preserve service boundaries.

### Ease of Configuration and Installation

Local setup requires only Docker Compose. Azure setup requires Azure credentials, Terraform variables, and GitHub repository secrets. Hetzner setup requires one VM, `cloud-init.yaml`, Docker, and GitHub SSH secrets. Terraform, cloud-init, Docker Compose, and GitHub Actions keep setup repeatable.

### Cost and Licensing

The stack uses open-source application frameworks. Container Apps is more cost-efficient than running a full Kubernetes cluster for this scale because it reduces idle control-plane and operations cost. Hetzner is cost-predictable and can run the complete stack on a small 2 vCPU / 4 GB VM. The tradeoff is that operating-system patching, Docker maintenance, and backup offloading become our responsibility.

### Monitoring and Logging

Container Apps sends logs to Log Analytics. On Hetzner, logs are available through `docker compose logs` and can be forwarded later to Grafana Loki or another log collector. Each API exposes `/health`, which supports liveness checks and release validation. Production improvement would add distributed tracing and structured request correlation IDs.

### Scaling

Container Apps supports scale-out and scale-in through replica limits. The Terraform configuration sets minimum and maximum replicas for each service. Hetzner scaling is vertical or replacement-based: resize the VM, move to a larger VM, or add a second VM behind a load balancer. This is simpler but less elastic than Container Apps.

### Rollback Plan

Images are immutable because each image is tagged with the Git commit SHA. Azure rollback uses Container Apps traffic weights. Hetzner rollback uses `rollback.sh` to switch Nginx back to the previous blue/green color. Database migrations should remain backward-compatible for at least one release to keep rollback realistic.

### Backup and Restore Strategy

PostgreSQL Flexible Server has automated backups with a seven-day retention period in the Terraform configuration. The Hetzner deployment runs `backup.sh` daily from cron and stores compressed `pg_dump` files in `/opt/recipeops/backups`. Recovery is performed by rebuilding the VM with `cloud-init.yaml`, redeploying the containers, copying a backup onto the server, and running `restore.sh`.

### Security

Secrets are stored in GitHub Actions secrets, Container Apps secrets, or the Hetzner `.env` file deployed over SSH. Azure OIDC is preferred where tenant policy allows it. Hetzner deployment uses SSH keys and GHCR tokens. Input validation is implemented in the catalog API with Zod. Production hardening should add HTTPS termination, a non-root deploy user, off-server backups, and stricter network rules.

### Support

The chosen services are mainstream and well-supported: Azure Container Apps, Hetzner Cloud, Docker Compose, PostgreSQL, Node.js, FastAPI, Terraform, and GitHub Actions. This reduces operational risk compared with less common tools.

### Vulnerability Checks on Images

Trivy scans each service image for high and critical vulnerabilities. Scan results are uploaded as SARIF so findings can be reviewed in GitHub code scanning and addressed through dependency or base-image updates.

### Sustainability

Container Apps scales down and removes the need to operate an always-on Kubernetes control plane. The Hetzner option uses a small fixed-size VM and avoids over-provisioning a cluster. CI builds only the three service images required by the application.

## Additional Features

The implementation includes:

- Container vulnerability scanning with Trivy.
- Health endpoints for both backend services.
- Seed data migration for repeatable local runs.
- Blue/green capable revision deployment through Azure Container Apps.
- Hetzner blue/green deployment with rollback and scheduled PostgreSQL backups.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Database schema change breaks rollback | High | Use backward-compatible migrations |
| Secret leakage | High | Store secrets in GitHub and Container Apps secrets |
| Cloud cost overrun | Medium | Use burstable PostgreSQL and small Container Apps CPU/memory |
| Service-to-service latency | Medium | Keep APIs small and monitor response times |
| Manual portal changes cause drift | Medium | Reapply Terraform and restrict portal writes |
| VM loss on Hetzner | High | Rebuild with cloud-init, redeploy images, restore PostgreSQL dump |

## Conclusion

RecipeOps demonstrates a release management approach for a microservice application. The design uses independent services, a managed data layer, infrastructure as code, automated tests, image scanning, immutable release artifacts, and revision-based rollback.
