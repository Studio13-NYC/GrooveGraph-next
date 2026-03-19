param(
  [string]$ResourceGroup = "rg-groovegraph",
  [string]$WebAppName = "as-groovegraph-api"
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$productRoot = Join-Path $repoRoot "product"

Push-Location $productRoot
try {
  Remove-Item Env:GROOVEGRAPH_STATIC_EXPORT -ErrorAction SilentlyContinue
  Remove-Item Env:NEXT_PUBLIC_API_BASE_URL -ErrorAction SilentlyContinue

  npm run build

  $zipPath = Join-Path $env:TEMP "groovegraph-next-appservice-smoke-$(Get-Date -Format 'yyyyMMddHHmmss').zip"
  $deployRoot = Join-Path $env:TEMP "groovegraph-next-appservice-smoke"

  if (Test-Path $deployRoot) {
    Remove-Item $deployRoot -Recurse -Force
  }

  New-Item -ItemType Directory -Path $deployRoot | Out-Null
  Copy-Item ".next\standalone\*" $deployRoot -Recurse -Force

  $staticTarget = Join-Path $deployRoot "product\.next\static"
  New-Item -ItemType Directory -Path $staticTarget -Force | Out-Null
  Copy-Item ".next\static\*" $staticTarget -Recurse -Force

  if (Test-Path "public") {
    Copy-Item "public" (Join-Path $deployRoot "product") -Recurse -Force
  }

  Push-Location $deployRoot
  try {
    tar -a -cf $zipPath node_modules product
    if ($LASTEXITCODE -ne 0) {
      throw "Failed to create deployment archive with tar."
    }
  }
  finally {
    Pop-Location
  }

  az webapp config set --name $WebAppName --resource-group $ResourceGroup --startup-file "node product/server.js" | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to update App Service startup command."
  }

  az webapp deploy --name $WebAppName --resource-group $ResourceGroup --src-path $zipPath --type zip --clean true | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to deploy package to App Service."
  }

  Write-Host "App Service smoke app deployed to https://$WebAppName.azurewebsites.net" -ForegroundColor Green
}
finally {
  Pop-Location
  if ($zipPath -and (Test-Path $zipPath)) {
    Remove-Item $zipPath -Force
  }
  if ($deployRoot -and (Test-Path $deployRoot)) {
    Remove-Item $deployRoot -Recurse -Force
  }
}
