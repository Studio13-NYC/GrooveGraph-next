# Deploy GrooveGraph Next.js app (`product/`) to Azure App Service.
# Wrapper around `deploy-appservice-research-workbench.ps1` (legacy filename retained for existing runbooks).

param(
  [string]$ResourceGroup = "rg-groovegraph",
  [string]$WebAppName = "as-groovegraph-api"
)

& "$PSScriptRoot/deploy-appservice-research-workbench.ps1" -ResourceGroup $ResourceGroup -WebAppName $WebAppName
