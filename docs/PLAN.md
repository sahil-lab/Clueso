# Phase plan

## Execution boundary

Current authorization is Phase 0 followed by Phase 1 only. No phase skipping,
cloud activity, real data, destructive operation, or Git action is authorized.
Requirements, architecture, and safety were written before application code.

## Phase 0 - contract and safety

- [x] Read all 3 PDF pages and all included prompts.
- [x] Inventory the project: only the PDF existed initially.
- [x] Verify Docker Engine 29.4.1 / Compose 5.1.3 / Linux containers.
- [x] Check assigned ports 18109 and 18209: no listeners at initial inspection.
- [x] Write README, PRD, threat model, architecture diagram, decisions, non-goals,
      measurable acceptance criteria, and coding conventions.
- [x] Define ignored artifacts and LF conventions.
- [x] Author CI configuration for the local verification workflow.
- [ ] Initialize Git: **deferred, not authorized**. This is not required to build
      or verify the on-disk monorepo.

Phase 0 contract gate: satisfied for local implementation. Git initialization is
an explicit approval-gated exception, not a completed task.

## Phase 1 - working skeleton

- [x] Bootstrap Java API, React dashboard, PostgreSQL, and isolated Compose stack.
- [x] Add liveness/readiness, V1 migration, validation, and implemented OpenAPI.
- [x] Add structured logs/trace context and documented local safety controls.
- [x] Add Java unit/integration and frontend unit tests.
- [x] Add real-browser happy-path and failure-path smoke tests.
- [x] Run format/lint/type-check/build/tests and fix observed failures.
- [x] Verify published ports, health, migration persistence, bounded resources,
      structured logging, and successful UI-to-database round trip.
- [x] Persist exact commands, test results, changed files, blockers, and next phase.

Verified by the complete local command on 2026-11-11, exit 0:
18 Java, 12 frontend, and 4 real Chromium tests. Host publication, a real database
outage, liveness/readiness separation, recovery, persistence, and trace logging
also passed. See [VERIFICATION.md](VERIFICATION.md); remote CI remains unexecuted.

## Phase 2 - core data and APIs (not started)

Define domain entities, API contracts, permissions, idempotency, state
transitions, and integration tests. Start with synthetic authorized tutorials;
complete access-control boundaries before exposing any domain mutation.

## Phase 3 - functional engine (not started)

Semantic recording and selectors; screenshots/DOM/accessibility/narration;
dependency graph; semantic/visual change detection; segment re-recording,
stitching, and review. Each module needs happy/failure tests before proceeding.

## Phase 4 - optional agents and automation (not started)

Explicit interfaces, limits, trace logging, and deterministic fallbacks.

## Phase 5 - reliability and observability (not started)

Timeouts, retries, rate limits, dead letters when justified, operational
dashboards, tracing export only if approved, and failure/chaos scenarios.

## Phase 6 - evaluation and packaging (not started)

Reproducible selective-change/replay benchmarks, false-alert/time-saved
measurements, limitations, synthetic fixtures, demo, and deployment guide.
Any cloud provisioning needs separate approval.
