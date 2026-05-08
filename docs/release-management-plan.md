# Release Management Plan: RecipeOps Microservice CI/CD

## Executive Summary

RecipeOps is a service-oriented recipe management application with two communicating backend services and a dedicated data layer. The implementation uses a Node.js frontend, a Node.js catalog API, a Python FastAPI recommendation API, and PostgreSQL. The release management plan provisions Azure infrastructure with Terraform and deploys container images through GitHub Actions.

The plan prioritises repeatability, automated change management, and recoverability. All infrastructure is declared as code, each service is independently testable and deployable, images are scanned before release, and Azure Container Apps revision management supports blue/green rollback.

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

The project uses GitHub Actions because it integrates directly with repository events, supports environment protection rules, and can authenticate to Azure using OpenID Connect. The pipeline has two workflows:

| Workflow | Trigger | Purpose |
|---|---|---|
| `ci.yml` | pull request and main branch push | Run service tests, build images, scan images |
| `cd.yml` | main branch push or manual dispatch | Provision Azure resources and deploy new revisions |

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

## Deployment Strategy

The chosen deployment strategy is blue/green through Azure Container Apps multiple revision mode. Each deployment pushes an immutable image tagged with the Git commit SHA and updates the relevant Container App. Container Apps creates a new revision, and traffic can be shifted between revisions.

Rollback is achieved by assigning traffic back to the previous healthy revision. This avoids rebuilding an old artifact and keeps rollback fast.

## Change Management

Changes follow this sequence:

1. Developer opens a pull request.
2. CI runs tests, builds images, and scans images.
3. Review approval is required before merge.
4. Main branch deployment runs Terraform.
5. Images are pushed with the commit SHA.
6. Container Apps are updated to new revisions.
7. Logs and health endpoints are checked.

This sequence reduces configuration drift because infrastructure changes and application changes are both tracked through version control.

Terraform quality checks also run in CI using `terraform init -backend=false`, `terraform fmt -check`, and `terraform validate`. The provider lock file includes checksums for local macOS development and GitHub Actions Linux runners.

## Evaluation Criteria

### Performance

Container Apps provides low operational overhead and supports horizontal scaling. PostgreSQL Flexible Server gives managed persistence with acceptable performance for this workload. The recommendation service calls the catalog API, adding a network hop, but the separation is intentional to preserve service boundaries.

### Ease of Configuration and Installation

Local setup requires only Docker Compose. Cloud setup requires Azure credentials, Terraform variables, and GitHub repository secrets. Terraform makes resource creation repeatable, while GitHub Actions keeps pipeline behaviour consistent.

### Cost and Licensing

The stack uses open-source application frameworks and managed Azure services. Container Apps is more cost-efficient than running a full Kubernetes cluster for this scale because it reduces idle control-plane and operations cost. PostgreSQL Flexible Server is sized at a burstable tier for development and small production workloads.

### Monitoring and Logging

Container Apps sends logs to Log Analytics. Each API exposes `/health`, which supports basic liveness checks and release validation. Production improvement would add distributed tracing and structured request correlation IDs.

### Scaling

Container Apps supports scale-out and scale-in through replica limits. The Terraform configuration sets minimum and maximum replicas for each service. Further improvement would add KEDA scale rules based on HTTP concurrency or queue depth.

### Rollback Plan

Images are immutable because each image is tagged with the Git commit SHA. Container Apps multiple revision mode allows traffic to return to the previous revision if a release fails. Database migrations should remain backward-compatible for at least one release to keep rollback realistic.

### Backup and Restore Strategy

PostgreSQL Flexible Server has automated backups with a seven-day retention period in the Terraform configuration. Recovery is performed by restoring to a new server or point in time, validating data, and updating the application connection string through Terraform or secret update.

### Security

Secrets are stored in GitHub Actions secrets and Container Apps secrets. The pipeline authenticates to Azure with OIDC rather than long-lived passwords. Input validation is implemented in the catalog API with Zod. Production hardening should add private networking, managed identities for ACR pull, and stricter database firewall rules.

### Support

The chosen services are mainstream and well-supported: Azure Container Apps, PostgreSQL, Node.js, FastAPI, Terraform, and GitHub Actions. This reduces operational risk compared with less common tools.

### Vulnerability Checks on Images

Trivy scans each service image for high and critical vulnerabilities. Scan results are uploaded as SARIF so findings can be reviewed in GitHub code scanning and addressed through dependency or base-image updates.

### Sustainability

Container Apps scales down and removes the need to operate an always-on Kubernetes control plane. The architecture avoids over-provisioning for a small workload. CI builds only the three service images required by the application.

## Additional Features

The implementation includes:

- Container vulnerability scanning with Trivy.
- Health endpoints for both backend services.
- Seed data migration for repeatable local runs.
- Blue/green capable revision deployment through Azure Container Apps.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Database schema change breaks rollback | High | Use backward-compatible migrations |
| Secret leakage | High | Store secrets in GitHub and Container Apps secrets |
| Cloud cost overrun | Medium | Use burstable PostgreSQL and small Container Apps CPU/memory |
| Service-to-service latency | Medium | Keep APIs small and monitor response times |
| Manual portal changes cause drift | Medium | Reapply Terraform and restrict portal writes |

## Conclusion

RecipeOps demonstrates a release management approach for a microservice application. The design uses independent services, a managed data layer, infrastructure as code, automated tests, image scanning, immutable release artifacts, and revision-based rollback.
