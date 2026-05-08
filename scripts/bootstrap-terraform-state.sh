#!/usr/bin/env bash
set -euo pipefail

LOCATION="${LOCATION:-westeurope}"
RESOURCE_GROUP="${TF_STATE_RESOURCE_GROUP:-rg-tfstate-recipeops}"
STORAGE_ACCOUNT="${TF_STATE_STORAGE_ACCOUNT:?Set TF_STATE_STORAGE_ACCOUNT to a globally unique storage account name.}"
CONTAINER="${TF_STATE_CONTAINER:-tfstate}"

az group create \
  --name "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --tags application=recipeops purpose=terraform-state

az storage account create \
  --name "$STORAGE_ACCOUNT" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --sku Standard_LRS \
  --kind StorageV2 \
  --allow-blob-public-access false \
  --min-tls-version TLS1_2 \
  --tags application=recipeops purpose=terraform-state

ACCOUNT_KEY="$(az storage account keys list \
  --resource-group "$RESOURCE_GROUP" \
  --account-name "$STORAGE_ACCOUNT" \
  --query '[0].value' \
  --output tsv)"

az storage container create \
  --name "$CONTAINER" \
  --account-name "$STORAGE_ACCOUNT" \
  --account-key "$ACCOUNT_KEY"

cat <<EOF
Terraform state backend is ready.

Use these GitHub secrets or environment variables:
TF_STATE_RESOURCE_GROUP=$RESOURCE_GROUP
TF_STATE_STORAGE_ACCOUNT=$STORAGE_ACCOUNT
TF_STATE_CONTAINER=$CONTAINER
TF_STATE_KEY=recipeops.tfstate
EOF

