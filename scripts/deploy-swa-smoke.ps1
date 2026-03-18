param(
  [string]$ResourceGroup = "rg-groovegraph",
  [string]$StaticWebAppName = "swa-groovegraph"
)

$ErrorActionPreference = "Stop"

if (-not $env:SWA_CLI_DEPLOYMENT_TOKEN) {
  $env:SWA_CLI_DEPLOYMENT_TOKEN = az staticwebapp secrets list --name $StaticWebAppName --resource-group $ResourceGroup --query "properties.apiKey" -o tsv
}

if (-not $env:SWA_CLI_DEPLOYMENT_TOKEN) {
  throw "Unable to resolve SWA_CLI_DEPLOYMENT_TOKEN."
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$staticRoot = Join-Path $repoRoot "product\swa-smoke"

Push-Location $repoRoot
try {
  npx @azure/static-web-apps-cli deploy $staticRoot --env production
  Write-Host "SWA smoke page deployed to https://groovegraph.s13.nyc" -ForegroundColor Green
}
finally {
  Pop-Location
}
