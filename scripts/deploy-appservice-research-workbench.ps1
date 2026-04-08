param(
  [string]$ResourceGroup = "rg-groovegraph",
  [string]$WebAppName = "as-groovegraph-api"
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$workspaceRoot = Join-Path $repoRoot "product"
$relativeAppPath = "product"
$startupCommand = "node $relativeAppPath/server.js"

if (-not (Test-Path $workspaceRoot)) {
  throw "Product app not found at $workspaceRoot"
}

Push-Location $repoRoot
try {
  npm run build -w "@groovegraph-next/product"
  if ($LASTEXITCODE -ne 0) {
    throw "next build (standalone) failed for product."
  }
}
finally {
  Pop-Location
}

Push-Location $workspaceRoot
$deploySucceeded = $false
$zipPath = $null
$deployRoot = $null
try {
  $stamp = Get-Date -Format "yyyyMMddHHmmss"
  $zipPath = Join-Path $env:TEMP "groovegraph-product-$stamp.zip"
  $deployRoot = Join-Path $env:TEMP "groovegraph-product-deploy-$stamp"

  New-Item -ItemType Directory -Path $deployRoot | Out-Null
  Copy-Item ".next\standalone\*" $deployRoot -Recurse -Force

  $staticTarget = Join-Path $deployRoot "product\.next\static"
  New-Item -ItemType Directory -Path $staticTarget -Force | Out-Null
  Copy-Item ".next\static\*" $staticTarget -Recurse -Force

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

  az webapp config set --name $WebAppName --resource-group $ResourceGroup --startup-file $startupCommand | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to update App Service startup command."
  }

  az webapp deploy --name $WebAppName --resource-group $ResourceGroup --src-path $zipPath --type zip --clean true | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to deploy package to App Service."
  }

  Write-Host "Product (research workbench) deployed to https://$WebAppName.azurewebsites.net" -ForegroundColor Green
  Write-Host "Startup: $startupCommand" -ForegroundColor DarkGray
  $deploySucceeded = $true
}
finally {
  Pop-Location
  try {
    if ($zipPath -and (Test-Path $zipPath)) {
      Remove-Item -LiteralPath $zipPath -Force
    }
  }
  catch {
    Write-Host "Note: could not remove temp zip (file may still be locked): $zipPath" -ForegroundColor DarkGray
  }
  try {
    if ($deployRoot -and (Test-Path $deployRoot)) {
      Remove-Item -LiteralPath $deployRoot -Recurse -Force
    }
  }
  catch {
    Write-Host "Note: could not remove temp deploy folder (may still be locked): $deployRoot" -ForegroundColor DarkGray
  }
}

if (-not $deploySucceeded) {
  exit 1
}
