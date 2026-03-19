# Azure Baseline

## Current environment

The existing Azure shell is already in place and should be reused.

Verified baseline:

- subscription: `KatsivelosAzureSub`
- resource group: `rg-groovegraph`
- location: `eastus2`

Current resources:

- `swa-groovegraph` - Static Web App (default `*.azurestaticapps.net` hostname only; custom domain not used for the live product surface)
- `plan-groovegraph` - App Service plan (**Basic B1** Linux — required for App Service managed TLS on custom hostnames)
- `as-groovegraph-api` - App Service — hosts the **OpenAI research workbench** (Next.js `output: "standalone"`) and answers **`https://groovegraph.s13.nyc`**
- `appi-groovegraph` - Application Insights
- `Failure Anomalies - appi-groovegraph` - smart detector alert rule

DNS (public zone `s13.nyc` in `rg-s13`, not in `rg-groovegraph`):

- `groovegraph` CNAME → `as-groovegraph-api.azurewebsites.net`
- `asuid.groovegraph` TXT → App Service domain verification ID (as required when binding the hostname)

## Preservation rule

Preserve:

- `rg-groovegraph`
- `plan-groovegraph` (resource; SKU may change with workload needs)
- `appi-groovegraph`
- the alerting resource unless explicitly changed

May be overwritten by GrooveGraph Next:

- `swa-groovegraph`
- `as-groovegraph-api`

## Live deploy path (research workbench)

The research app under `research/tools/openai-research-workspace` uses dynamic App Router API routes; it is deployed as a **Node standalone** package to App Service, not as a static SWA export.

From repo root:

```powershell
.\scripts\deploy-appservice-research-workbench.ps1
```

Requires App Service app settings (at minimum): `OPENAI_API_KEY` (see workspace server config).

## Historical note

Early smoke validation used a static SWA placeholder and/or a minimal App Service Next app. The **canonical live URL** for the research workbench is **`https://groovegraph.s13.nyc`** on **`as-groovegraph-api`**.
