# Clueso-inspired tutorial updater

An original, local engineering prototype for a **Self-Updating Product Tutorial
Generator**. This project is not affiliated with Clueso and does not use its
private architecture, systems, or data.

## Current scope

Only Phase 0 (contract and safety) and Phase 1 (working skeleton) are authorized.
The verified skeleton is a React/TypeScript dashboard, a Java 21/Spring Boot 3 API,
and PostgreSQL, isolated with Docker Compose project `clueso`.

**Verified locally:** formatting, lint, type checks, production builds,
18 Java tests, 12 frontend tests, 4 real Chromium E2E tests, actual localhost
publication, and database outage/recovery with migration persistence.
Git initialization and remote CI remain unapproved/unexecuted.

**Not implemented:** recording, screenshots, narration, tutorial entities,
dependency graphs, change detection, re-recording, publishing, authentication,
workers, Redis, Kafka, AI agents, or cloud deployment. The final-product benchmark
targets are not Phase 1 claims.

See [current status](docs/STATUS.md), [phase plan](docs/PLAN.md), and
[requirements](docs/PRD.md). Implementation and verification status must be
recorded separately.

## Local operation

Docker Desktop with Linux containers and PowerShell are the only host
prerequisites. Host Node and Java are not used. Run from this project directory:

```powershell
.\scripts\clueso.ps1 -Action Up
.\scripts\clueso.ps1 -Action Verify
.\scripts\clueso.ps1 -Action Status
```

Full command output and observed pass/failure history are recorded in
[verification evidence](docs/VERIFICATION.md). `Verify` deliberately stops and
recovers only the Clueso database to test readiness; do not run it during a demo.

- Dashboard: <http://localhost:18109>
- API liveness: <http://localhost:18209/actuator/health/liveness>
- API readiness: <http://localhost:18209/actuator/health/readiness>
- PostgreSQL: internal only, **no published host port**.

The setup script generates a local database secret under `.local/secrets/`;
it must never be printed, checked in, or replaced after database initialization.
Compose owns only `clueso` resources. Runtime containers have explicit CPU,
memory, and process limits. Dependencies are downloaded by build/tool containers;
PostgreSQL and the test database stay on private networks. Web/API also join a
Clueso-only ingress network so Docker can publish the assigned loopback ports.
That network permits egress, but the application has no external integrations,
URL input, remote assets, or telemetry exporter.

## Documentation

- [PRD and measurable acceptance criteria](docs/PRD.md)
- [Architecture and boundaries](docs/ARCHITECTURE.md)
- [Threat model and safety constraints](docs/THREAT_MODEL.md)
- [Architecture decisions](docs/DECISIONS.md)
- [Coding conventions](docs/CODING_CONVENTIONS.md)
- [Plan and future phases](docs/PLAN.md)
- [Observed verification evidence](docs/VERIFICATION.md)
- [Complete source file inventory](docs/CHANGED_FILES.md)

The engineering guide is
[09_Clueso_Tutorial_Updater.pdf](09_Clueso_Tutorial_Updater.pdf).
All three pages, including the four included agent prompts, were read before
implementation. The start-from-zero prompt governs this task; later prompts are
applied only where they concern verification of this skeleton.

## Limitations

This is a synthetic-data, single-machine development environment, not a
production service. There is no user authentication or authorization yet.
The only diagnostic POST is read-only: it validates a synthetic label and reads
the migrated platform metadata. No arbitrary URL, file, credential, or tutorial
content is accepted. Recording and publishing remain unavailable.

Git initialization has not been authorized for this project. The monorepo is
scaffolded on disk without creating a Git repository, commits, branches, or
remotes. CI configuration is local source until separately authorized.

## Short local demo

1. Open <http://localhost:18109>. API/database cards start as **Not checked**.
2. Submit the default synthetic label. The dashboard reports **Round trip
   complete**, `clueso-api`, and database schema version 1.
3. Enter spaces only: the UI reports a validation error rather than claiming
   success. Use a valid synthetic label to retry.

The POST is read-only; no label is stored. Recording and publishing are not
available. The next phase is core domain data and permissioned APIs, not an
unapproved browser-recording shortcut.

## Local troubleshooting

- Use `.\scripts\clueso.ps1 -Action Status` to inspect only Clueso containers.
- If Docker is unavailable, start Docker Desktop normally; do not reset/prune it.
- If either assigned port is occupied, identify the owner; never stop another
  project or silently choose different ports.
- The new runtime/edge networks use `198.18.109.0/28` and `198.18.109.48/28`.
  Existing test/tooling networks are retained. Check for overlap on another host;
  do not alter global Docker address pools.
- Use the supplied container commands, not host Node 14 or a host Java install.
  Generated Node dependencies live in `clueso_node_modules` to avoid Windows
  bind-mount replacement failures.
- Preserve the local secret and database volumes together. There is intentionally
  no data-reset command. Git actions, cloud spending, real data, destructive
  cleanup, and remote publication need separate approval.
