# Clueso-inspired tutorial updater

An original, local engineering prototype for a **Self-Updating Product Tutorial
Generator**. This project is not affiliated with Clueso and does not use its
private architecture, systems, or data.

## Current scope

Only Phase 0 (contract and safety) and Phase 1 (working skeleton) are authorized.
The verified skeleton is a React/TypeScript web experience, a Java 21/Spring Boot 3
API, and PostgreSQL, isolated with Docker Compose project `clueso`.

**Verified locally:** formatting, lint, type checks, production builds,
18 Java baseline tests, 23 frontend tests, 11 real Chromium E2E tests, actual
localhost publication, and database outage/recovery with migration persistence.
Git publishing and remote CI were not performed.

**Stories in motion:** a dark, scroll-choreographed experience built around one
persistent WebGL2 particle field. Sixty thousand particles (on a GPU) assemble
into a living loop, tear into a glitching "stale frame", and re-form as a cursor,
a delta, a check mark and a wave terrain as you scroll. A counting preloader,
Lenis smooth scrolling, a custom cursor, magnetic buttons, a velocity-coupled
marquee, a scroll-linked word reveal and a pinned three-stage workflow sequence
carry the story to a glass console that runs the real check. GPUs also get a
three-level bloom pass; software renderers get a lighter field; browsers without
WebGL2 get static artwork. Motion is pausable and follows the system
reduced-motion preference. Type is self-hosted Manrope and Instrument Serif.
Capture/Detect/Review remains keyboard-operable; the live lab keeps its clear
diagnostic states, JSON inspection, and reset controls.
The preview is synthetic and never records, compares, publishes, or calls an API.
The backend and API contract are unchanged. Raw WebGL2 is used directly; the only
new runtime dependency is `lenis` (MIT). Fonts and scripts are local files; the
Content-Security-Policy is unchanged. The HTML shell is served `no-cache` so a
redeploy is never hidden behind a stale page.

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

- Web experience: <http://localhost:18109>
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

Git metadata now exists, created outside this UI task. This session did not
initialize it, alter its index, create commits, configure remotes, or push.
Read-only status showed only the expected UI edits. CI configuration is local
source until separately authorized.

## Short local demo

1. Open <http://localhost:18109> in a desktop browser. If an older design
   appears, reload once with Ctrl+F5. Let the counter reach 100, then move the
   pointer: the particle form tilts and parts around it.
2. Scroll. The loop tears into a stale frame while the headline lights up word
   by word, then the pinned workflow walks through Capture, Detect, and Review.
   The tabs, Arrow keys, Home, and End also work; none of this executes backend
   work.
3. Use **Enter the lab**, then submit the default synthetic label under **Real
   check. No magic.** The interface reports **Round trip complete**,
   `clueso-api`, and database schema version 1, and a pulse runs through the field.
4. Expand **View response JSON**, or **Clear result** to reset the visible check.
5. Enter spaces only: the UI reports a validation error rather than claiming
   success. Use a valid synthetic label to retry.
6. **Motion on/off** in the header pauses or resumes all decorative motion. System
   reduced motion is respected automatically.
7. On mobile, use the navigation menu. Escape closes it and returns keyboard focus.

The right-edge readout names the current form and the live particle count. On a
machine without GPU acceleration it shows a smaller count; without WebGL2 it
reads "Static artwork".

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
- If the page shows "Static artwork" or a small particle count, the browser has
  no WebGL2 or is using a software renderer; enable hardware acceleration in the
  browser settings. The check itself works either way.
- `Verify` waits on container health and takes about eight minutes. If the
  machine sleeps mid-run the wait expires, the run fails, and the web container
  can be left created but not started. Start the stack again with
  `docker compose --project-name clueso --file .\infra\docker\compose.yaml up --detach --wait db api web`,
  then `.\scripts\clueso.ps1 -Action VerifyRuntime` re-runs only the live-stack
  assertions (it briefly stops and recovers the Clueso database) without
  rebuilding anything.
- Preserve the local secret and database volumes together. There is intentionally
  no data-reset command. Git actions, cloud spending, real data, destructive
  cleanup, and remote publication need separate approval.
