# Website Audit SaaS Architecture

## Final Architecture

The application is split into a Next.js web/API app and a long-running worker service. The web app owns authentication, workspace authorization, dashboard/report UI, scan creation, and read APIs. The worker owns crawling, browser rendering, screenshots, deterministic analyzers, and persistence of scan results.

Playwright scans are never run inside short-lived serverless API handlers. API routes enqueue BullMQ jobs in Redis, while worker servers run Chromium in isolated containers with strict URL validation and navigation guards.

## Folder Structure

```text
app/                  Next.js routes, dashboard, report UI, API routes
components/           Reusable UI primitives
lib/
  ai/                 Provider interface and OpenAI adapter placeholder
  auth/               User/workspace resolution and authorization helpers
  db/                 Prisma client
  queue/              BullMQ queue and progress helpers
  scanner/            Crawl, browser, analyzers, scoring, persistence
  security/           URL normalization and SSRF controls
  validation/         Zod schemas and issue contracts
prisma/               Database schema and migrations
worker/               BullMQ worker entrypoint
tests/                Unit tests for scanner/security/scoring behavior
```

## Database Schema

Core entities are `User`, `Workspace`, `WorkspaceMember`, `Website`, `Scan`, `ScanPage`, `Issue`, `Screenshot`, `ScanMetric`, `Subscription`, and `UsageEvent`. Every website, scan, page, issue, and screenshot belongs to a workspace to preserve multi-tenant boundaries.

## Scan Lifecycle

1. User submits a public URL and scan settings.
2. API validates URL and rejects private/internal targets.
3. API creates `Website` and `Scan` records.
4. API enqueues `scan.run` in BullMQ.
5. Worker discovers URLs, renders pages in Chromium, captures screenshots, runs analyzers, stores issues, computes scores, and marks the scan complete.
6. Dashboard polls scan status and report APIs for progress and results.

## Worker Architecture

The worker composes scanner modules behind predictable analyzer interfaces. Milestone 1 runs homepage-focused scans with desktop/mobile screenshots, DOM collection, horizontal overflow detection, broken images, broken links, console errors, basic spelling checks, and axe accessibility.

Future analyzers can be added independently under `lib/scanner/analyzers` and registered in the worker pipeline without changing API routes.

## Security Strategy

Submitted URLs are normalized and validated before queueing. The scanner blocks unsupported protocols, localhost, private IP ranges, link-local ranges, cloud metadata addresses, suspicious redirects, common destructive paths, and excessive crawl counts. The worker re-validates each URL before browser navigation to reduce DNS rebinding and redirect risk.

Production deployments should run workers in locked-down containers with egress firewall rules and resource limits.

## Implementation Phases

1. Milestone 1: Auth scaffold, dashboard, scan creation, queue, worker, homepage scan, core analyzers, issue storage, report UI, progress polling.
2. Crawl expansion: sitemap/navigation crawl, page limits, depth controls, scan history comparisons.
3. Advanced UX/design: responsive comparison, alignment/spacing/typography heuristics, screenshot annotations.
4. AI review: provider abstraction, OpenAI vision review, content summary, design issue validation, response caching.
5. SaaS hardening: billing integration, plan limits, exports, team management, deployment observability.
