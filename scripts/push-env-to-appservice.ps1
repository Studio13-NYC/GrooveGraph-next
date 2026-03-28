param(
  [string]$EnvFile = (Join-Path (Split-Path -Parent $PSScriptRoot) ".env.local"),
  [string]$ResourceGroup = "rg-groovegraph",
  [string]$WebAppName = "as-groovegraph-api"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $EnvFile)) {
  throw "Env file not found: $EnvFile"
}

$items = [System.Collections.ArrayList]::new()
Get-Content -LiteralPath $EnvFile | ForEach-Object {
  $line = $_.Trim()
  if ($line -match "^\s*#" -or $line -eq "") {
    return
  }
  $i = $line.IndexOf("=")
  if ($i -lt 1) {
    return
  }
  $name = $line.Substring(0, $i).Trim()
  $value = $line.Substring($i + 1).Trim()
  [void]$items.Add(@{ name = $name; value = $value; slotSetting = $false })
}

$jsonPath = Join-Path $env:TEMP ("groovegraph-appsettings-{0}.json" -f (Get-Date -Format "yyyyMMddHHmmss"))
try {
  ($items | ConvertTo-Json -Depth 5 -Compress) | Set-Content -LiteralPath $jsonPath -Encoding utf8
  az webapp config appsettings set --resource-group $ResourceGroup --name $WebAppName --settings "@$jsonPath"
  if ($LASTEXITCODE -ne 0) {
    throw "az webapp config appsettings set failed with exit code $LASTEXITCODE"
  }
  Write-Host "App settings updated on $WebAppName ($ResourceGroup). Keys: $($items.name -join ', ')" -ForegroundColor Green
}
finally {
  if ($jsonPath -and (Test-Path -LiteralPath $jsonPath)) {
    Remove-Item -LiteralPath $jsonPath -Force -ErrorAction SilentlyContinue
  }
}
