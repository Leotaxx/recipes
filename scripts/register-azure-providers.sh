#!/usr/bin/env bash
set -euo pipefail

providers=(
  Microsoft.App
  Microsoft.ContainerRegistry
  Microsoft.DBforPostgreSQL
  Microsoft.OperationalInsights
  Microsoft.Resources
  Microsoft.Storage
)

for provider in "${providers[@]}"; do
  az provider register --namespace "$provider"
done

for provider in "${providers[@]}"; do
  az provider show --namespace "$provider" --query "{namespace:namespace,state:registrationState}" --output table
done

