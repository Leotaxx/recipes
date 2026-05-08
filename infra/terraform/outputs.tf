output "resource_group_name" {
  value = azurerm_resource_group.main.name
}

output "acr_login_server" {
  value = azurerm_container_registry.main.login_server
}

output "acr_name" {
  value = azurerm_container_registry.main.name
}

output "frontend_url" {
  value = "https://${azurerm_container_app.frontend.latest_revision_fqdn}"
}

output "catalog_api_url" {
  value = "https://${azurerm_container_app.catalog_api.latest_revision_fqdn}"
}

output "recommendation_api_url" {
  value = "https://${azurerm_container_app.recommendation_api.latest_revision_fqdn}"
}
