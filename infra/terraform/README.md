# Azure Terraform Deployment

This module provisions the Azure alternative for the RecipeOps microservice deployment:

- Resource Group
- Log Analytics Workspace
- Azure Container Registry
- Azure Container Apps Environment
- Three Container Apps
- PostgreSQL Flexible Server and database

`location` controls the main application resources. `postgres_location` controls PostgreSQL separately because student subscriptions can restrict PostgreSQL Flexible Server offers in otherwise valid Azure regions. The PostgreSQL server name includes the PostgreSQL region to avoid name conflicts with failed regional provisioning attempts.

## Local Validation

```bash
terraform init -backend=false
terraform fmt -check -recursive
terraform validate
```

## Local Plan

```bash
cp terraform.tfvars.example terraform.tfvars
cp backend.tf.example backend.tf
terraform init
terraform plan
```

Update `backend.tf` before `terraform init`. `backend.tf` and `terraform.tfvars` must not be committed because they contain environment-specific deployment configuration.

## Remote State

This module uses the AzureRM backend. Bootstrap the state storage once from the repository root:

```bash
./scripts/register-azure-providers.sh
export TF_STATE_STORAGE_ACCOUNT="strecipeopstfstate123"
./scripts/bootstrap-terraform-state.sh
```

The storage account name must be globally unique.

The Terraform provider is configured with `skip_provider_registration = true` so it does not try to register unrelated Azure providers during plan/apply. Registering the small provider set above is required before the first deployment.

## GitHub Actions Secrets

The manual Azure `cd` workflow expects these repository or environment secrets:

- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`
- `POSTGRES_ADMIN_PASSWORD`
- `TF_STATE_RESOURCE_GROUP`
- `TF_STATE_STORAGE_ACCOUNT`
- `TF_STATE_CONTAINER`
- `TF_STATE_KEY`

The Azure identity should have permission to create the resources in this module and push images to the Azure Container Registry.

For GitHub Actions OIDC login, add federated credentials to the Azure app registration for each deployment environment used by the `cd` workflow:

- `repo:Leotaxx/recipes:environment:dev`
- `repo:Leotaxx/recipes:environment:prod`

If the Azure tenant does not allow the current user to create app registrations, service principals, or federated credentials, this workflow cannot be fully automated without administrator support. In that case, use the working Hetzner CD route in `deploy/hetzner` for the demonstration and keep this module as the Terraform/IaC managed-cloud option in the RMP.
