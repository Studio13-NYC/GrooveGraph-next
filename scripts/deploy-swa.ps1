param(
  [string]$ResourceGroup = "rg-groovegraph",
  [string]$StaticWebAppName = "swa-groovegraph",
  [string]$ApiBaseUrl = "https://as-groovegraph-api.azurewebsites.net"
)

$ErrorActionPreference = "Stop"

if (-not $env:SWA_CLI_DEPLOYMENT_TOKEN) {
  $env:SWA_CLI_DEPLOYMENT_TOKEN = az staticwebapp secrets list --name $StaticWebAppName --resource-group $ResourceGroup --query "properties.apiKey" -o tsv
}

if (-not $env:SWA_CLI_DEPLOYMENT_TOKEN) {
  throw "Unable to resolve SWA_CLI_DEPLOYMENT_TOKEN (set env or run az login with access to the SWA)."
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$productRoot = Join-Path $repoRoot "product"
$outDir = Join-Path $productRoot "out"

Push-Location $productRoot
try {
  $env:GROOVEGRAPH_STATIC_EXPORT = "1"
  $env:NEXT_PUBLIC_API_BASE_URL = $ApiBaseUrl.TrimEnd("/")

  if (Test-Path $outDir) {
    Remove-Item $outDir -Recurse -Force
  }

  npm run build
  if ($LASTEXITCODE -ne 0) {
    throw "next build (static export) failed."
  }

  if (-not (Test-Path $outDir)) {
    throw "Expected static export at $outDir but it was not created."
  }
}
finally {
  Remove-Item Env:GROOVEGRAPH_STATIC_EXPORT -ErrorAction SilentlyContinue
  Remove-Item Env:NEXT_PUBLIC_API_BASE_URL -ErrorAction SilentlyContinue
  Pop-Location
}

Push-Location $repoRoot
try {
  npx @azure/static-web-apps-cli deploy $outDir --env production
  if ($LASTEXITCODE -ne 0) {
    throw "SWA CLI deploy failed."
  }
  Write-Host "UI deployed to https://groovegraph.s13.nyc (Static Web App: $StaticWebAppName)" -ForegroundColor Green
}
finally {
  Pop-Location
}
