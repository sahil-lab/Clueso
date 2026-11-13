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

### Phase 1 UI refinement - verified

- [x] Replace the sparse dashboard with a polished, responsive tutorial studio.
- [x] Add original illustrations and a clearly labelled synthetic workflow preview.
- [x] Preserve the read-only diagnostic contract and all failure/retry behavior.
- [x] Verify keyboard preview navigation, mobile navigation, JSON disclosure/reset,
      reduced-motion layout, and 320-1440px horizontal-overflow boundaries.
- [x] Pass formatting/lint/types/build, 14 frontend tests, and 7 Chromium tests.
- [x] Measure essential text contrast: eight targets, minimum 5.23:1.
- [x] Recreate only the web container and confirm actual localhost access.

This refines the authorized Phase 1 interface; it does not implement any later
recording, comparison, publishing, or domain module.

### Phase 1 refinement: editorial direction - verified, then superseded

- [x] Replace the rejected dashboard concept with an original editorial microsite.
- [x] Add self-hosted licensed typography and an original dimensional motion study.
- [x] Verify pointer response, manual motion pause/resume, and live system
      reduced-motion changes.
- [x] Preserve the synthetic preview and real read-only diagnostic behavior.
- [x] Keep the existing CSP; emit font assets as local files instead of data URLs.
- [x] Pass formatting/lint/types/build, 15 frontend tests, and 9 Chromium tests.
- [x] Inspect actual desktop/mobile composition and preserve exact evidence.

### Latest Phase 1 refinement: immersive WebGL direction - verified

- [x] Replace the static editorial layout with a scroll-choreographed experience
      around one persistent WebGL2 particle field that morphs through six forms.
- [x] Add preloader, smooth scrolling, custom cursor, magnetic buttons, velocity
      marquee, scroll-linked word reveal, and a pinned three-stage workflow.
- [x] Keep the real read-only diagnostic, its failure/retry paths, and every
      synthetic-preview disclaimer; pulse the field on a real result.
- [x] Degrade deliberately: lighter profile on software renderers, static SVG
      without WebGL2, everything decorative off when motion is paused or reduced.
- [x] Add a GPU-only three-level bloom, responsive form placement that clears
      the HUD, a dark thin scrollbar, and a two-column lab down to 901px.
- [x] Bound cost: adaptive particle reduction, glow dropped last, and a capped
      backing store for very large displays.
- [x] Keep the CSP unchanged; serve the HTML shell `no-cache`.
- [x] Pass formatting/lint/types/build, 23 frontend tests, 18 Java tests, and
      11 Chromium tests, plus the live-stack outage/recovery assertions.
- [x] Inspect every section on a real GPU and record method, numbers, and limits.
- [ ] Not done: other browsers, mobile/low-end GPU measurement, a 4K display,
      and automated coverage of the GPU-only bloom path.

This is still Phase 1. It does not add the future recording or comparison engine.

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
