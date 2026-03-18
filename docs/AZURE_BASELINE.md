# Azure Baseline

## Current environment

The existing Azure shell is already in place and should be reused.

Verified baseline:

- subscription: `KatsivelosAzureSub`
- resource group: `rg-groovegraph`
- location: `eastus2`

Current resources:

- `swa-groovegraph` - Static Web App
- `plan-groovegraph` - App Service plan
- `as-groovegraph-api` - App Service
- `appi-groovegraph` - Application Insights
- `Failure Anomalies - appi-groovegraph` - smart detector alert rule

## Preservation rule

Preserve:

- `rg-groovegraph`
- `plan-groovegraph`
- `appi-groovegraph`
- the alerting resource unless explicitly changed

May be overwritten by GrooveGraph Next:

- `swa-groovegraph`
- `as-groovegraph-api`

## First deployment stance

Use the smallest smoke-test deployment path first.

Recommended first step:

- deploy a single App Service-hosted Next.js smoke app that serves:
  - homepage takeover message
  - `/api/smoke`

This proves:

- Azure app-host access
- runtime env wiring
- homepage rendering
- API route behavior

Only after that should the split SWA plus App Service path be revisited.
