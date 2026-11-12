# Product requirements

## Problem and users

Product UI changes can make tutorials stale. The eventual product should connect
authorized semantic browser recordings to UI snapshots and a tutorial dependency
graph, so reviewers can identify and approve narrowly scoped updates.
The prototype audience is engineering teams and technical evaluators.

This document separates eventual product goals from the authorized Phase 1
deliverable. Only synthetic input is permitted.

## Phase 0 deliverable

Requirements, safety boundaries, an architecture diagram, decisions, coding
conventions, a phase plan, local CI configuration, and an ignored-artifact policy
must exist before application implementation.

The source guide was read completely: 3 pages, SHA-256
`00268b4dddfc3ff2f03ca89ecc6e3c57b96711919293c39a971ed1117391141c`.
Its Git/commit suggestions do not override the user's explicit approval boundary.
Creating a Git repository remains deferred, not silently marked done.

## Phase 1 user stories

1. As a developer, I can start a bounded, isolated local stack without installing
   Node or Java on the host.
2. As an evaluator, I can open the dashboard and send a synthetic diagnostic
   label through the web proxy to the API and a real migrated PostgreSQL database.
3. As an operator, I can distinguish process liveness from database-backed
   readiness without receiving database credentials or internal error details.
4. As a developer, I receive a clear validation error for malformed or
   out-of-contract input and a retryable UI error for unavailable services.
5. As a maintainer, I can reproduce formatting, lint, compilation, unit,
   integration, and real browser smoke checks with containerized tooling.

## Measurable acceptance criteria

| ID    | Required observation                                                                                                                                                          |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0-1  | All required contract/safety documents exist before application code.                                                                                                         |
| P0-2  | No Git initialization, cloud action, real user data, or out-of-project authored file. CI is authored but not claimed to have run remotely.                                    |
| P1-1  | The documented `Up` command reaches healthy web/API/database services under Compose project `clueso`.                                                                         |
| P1-2  | Only `127.0.0.1:18109` (web) and `127.0.0.1:18209` (API) are published; PostgreSQL has no host port. All services/tooling have resource limits.                               |
| P1-3  | Liveness and readiness return HTTP 200 and `status: UP`; readiness includes database and migrated metadata checks.                                                            |
| P1-4  | Flyway applies exactly the V1 baseline successfully to real PostgreSQL. A restart preserves that row and does not reapply V1.                                                 |
| P1-5  | A browser-submitted valid label yields `service: clueso-api`, `status: ready`, the same label, and `schemaVersion: 1` from the database.                                      |
| P1-6  | Blank, null, missing, overly long, invalid-character, malformed JSON, and unknown-field requests return HTTP 400 problem details without echoed input or stack traces.        |
| P1-7  | Invalid input is visibly reported; a failed browser request produces an explicit error and permits a successful retry.                                                        |
| P1-8  | Java formatting/compilation/tests, frontend formatting/lint/type-check/production build/unit tests, and real Chromium E2E tests pass with recorded counts and exact commands. |
| P1-9  | Application logs are parseable structured JSON; an observed diagnostic request contains trace context but does not log its label or database secret.                          |
| P1-10 | Source and generated lockfiles, evidence, residual limitations, and the next unfinished phase are inventoried. Unexecuted checks remain explicit.                             |

## Phase 1 interface

The read-only `POST /api/v1/system/check` accepts JSON:

```json
{ "label": "synthetic-smoke" }
```

`label` is required, 1-64 characters, nonblank, and limited to ASCII letters,
digits, spaces, periods, underscores, and hyphens. Unknown properties are invalid.
The server reads a singleton metadata row installed by Flyway; it does not store
the label or create a tutorial. Success has exactly four properties: `service`,
`status`, `label`, and `schemaVersion`. Errors use `application/problem+json`.

Liveness is `/actuator/health/liveness`; readiness is
`/actuator/health/readiness`. Health details and management mutation endpoints
are not exposed. The static web server has `/healthz`.

## Explicit non-goals

- Phase 2 domain tables, permissions, idempotent domain writes, state transitions.
- Phase 3 recording, replay, snapshots, diffing, stitching, and review workflows.
- Real target applications, browser credentials, arbitrary URL access, uploads,
  recording or publishing any user content.
- Redis/Kafka without a demonstrated need; optional agents or nondeterministic
  behavior; external telemetry; cloud services.
- Performance or benchmark claims, production readiness, production security,
  remote CI execution, Git actions.

## Phase 1 UI refinement

### Revised art direction after user feedback

The dashboard-style refinement was not the requested creative direction. Replace
its sidebar, pastel card grid, and conventional SaaS hierarchy with an original
editorial, motion-led microsite: poster-scale self-hosted typography, warm paper /
near-black / lime palette, an original dimensional centerpiece, and a scroll-led
synthetic workflow. Reference the craft of award-site design without copying a
specific site's assets or claiming any award.

Preserve the real diagnostic in a quieter local-lab section. Decorative motion
must be pausable, respect the system reduced-motion preference, and not block
content or keyboard interaction. All font/graphic assets must be local; use only
licensed font packages, no external trackers, image services, or new domain APIs.
Validate the loaded fonts, motion controls, desktop/mobile composition, text
contrast, and the unchanged real API/database workflow.

The requested visual enhancement stays within the existing local skeleton.
Improve typography, contrast, spacing, responsive navigation, and diagnostic
feedback. An interactive synthetic storyboard may illustrate the future
capture/detect/review workflow, but must be labelled as a concept and must not
record, compare, publish, or issue new API calls.

Acceptance: preserve the existing real diagnostic happy/failure paths; support
keyboard selection of preview steps and mobile navigation; provide readable
empty/loading/error/success states; verify desktop and mobile browser behavior
without horizontal overflow, external assets, or new runtime dependencies.

## Later product acceptance targets (not verified here)

- A one-step UI change flags only impacted tutorials.
- Replay survives cosmetic selector changes.
- False change alerts and time saved are measured against reproducible fixtures.
- Authorized recording, sensitive-content masking, and explicit publish approval
  are implemented and tested before any recording feature is exposed.
