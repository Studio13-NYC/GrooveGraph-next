# Push TYPEDB_CONNECTION_STRING from product/.env.local to as-groovegraph-api (App Service).
# Uses KEY=VALUE form for az (avoids malformed JSON @file issues on Windows).
$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $repoRoot "product\.env.local"
$cs = $null
Get-Content $envPath | ForEach-Object {
  if ($_ -match '^TYPEDB_CONNECTION_STRING=(.*)$') {
    $cs = $Matches[1].Trim()
  }
}
if (-not $cs) {
  throw "TYPEDB_CONNECTION_STRING not found in product/.env.local"
}
# Pass value without PowerShell interpreting ? & etc.
az webapp config appsettings set `
  --name as-groovegraph-api `
  --resource-group rg-groovegraph `
  --settings "TYPEDB_CONNECTION_STRING=$cs" | Out-Null
if ($LASTEXITCODE -ne 0) {
  throw "az webapp config appsettings set failed"
}
Write-Host "App Service: TYPEDB_CONNECTION_STRING set (value not printed)." -ForegroundColor Green
