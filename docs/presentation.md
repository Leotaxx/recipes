# RecipeOps CI/CD Presentation

## Slide 1: Title

RecipeOps: CI/CD for a microservice recipe platform.

## Slide 2: Architecture

Frontend, catalog API, recommendation API, and PostgreSQL are separated by clear service contracts. The recommendation API calls the catalog API, proving service-to-service communication.

## Slide 3: Pipeline

Pull requests run tests, image builds, and Trivy scans. Main branch deployments run Terraform, push images to ACR, and update Azure Container Apps revisions.

## Slide 4: IaC

Terraform provisions the resource group, Container Apps environment, Azure Container Registry, PostgreSQL Flexible Server, firewall rule, and Log Analytics workspace.

## Slide 5: Release Strategy

Azure Container Apps runs in multiple revision mode. New releases create revisions, health is checked, and traffic can be shifted gradually or rolled back to the previous revision.

## Slide 6: Operations

Health endpoints, Log Analytics, image scanning, PostgreSQL backups, and environment-scoped GitHub approvals create a repeatable operational model.

## Slide 7: Evaluation

The chosen design balances cost, automation, scaling, security, and support. Container Apps reduces cluster maintenance compared with AKS while retaining revision-based deployment control.

## Slide 8: Demo

Show local app, service health, CI workflow, Terraform apply, pushed images, deployed frontend URL, and rollback procedure.
