# Current status

## Latest update: immersive WebGL direction

- The user asked three times for an Awwwards-calibre experience; the editorial
  page was still a mostly static layout. It has been replaced by a dark,
  scroll-choreographed experience built around one persistent WebGL2 particle
  field (60,000 particles on GPUs) that morphs through six forms as the story
  advances: living loop, stale frame, capture, detect, review, foundation.
- Around it: a counting preloader with a curtain reveal, Lenis smooth scrolling,
  a custom cursor, magnetic buttons, a velocity-coupled marquee, a scroll-linked
  word reveal, a pinned three-stage workflow sequence, a glass console for the
  real check, and a lime footer. GPUs additionally get a three-level bloom pass.
- The real diagnostic is unchanged in behavior: browser -> proxy -> Java API ->
  migrated PostgreSQL. A successful or failed check sends a pulse through the field.
- Decorative motion can be paused, follows the system reduced-motion preference,
  and never blocks content or keyboard use. Without WebGL2 a static SVG is shown.
- Software rasterizers get a lighter profile (6,000 particles, half-resolution
  backing store, alternate frames, no bloom) so the page itself stays responsive.
- Dependencies: `lenis@1.3.27` (MIT) and `@fontsource/instrument-serif@5.3.0`
  (OFL-1.1) added; `@fontsource/anton` removed. No three.js, no animation
  framework, no remote asset, no cloud service. The CSP is not weakened.
- Passed against the final sources: Prettier, ESLint, TypeScript, production
  build, **23 frontend tests**, **18 Java tests**, **11 real Chromium tests**,
  host publication, isolation assertions, and the real database outage/recovery.
  These were completed in stages rather than by one uninterrupted `Verify`:
  the host entered Modern Standby during two attempts. See VERIFICATION.md.
- Hardware inspection (Intel Arc integrated graphics via ANGLE/D3D11, 1024x768
  CSS px at 1.5x): the sections were rendered and reviewed on the GPU; the field
  plus bloom costs about 3.7 ms per frame there. The tab was in the background,
  so frames were driven by the inspection harness: live pointer and wheel
  interaction was not watched on the GPU. The automated suite runs on a software
  renderer and therefore does **not** exercise the bloom path.
- Infrastructure change: the HTML shell is now served with a `no-cache` policy,
  so a redeploy cannot be masked by a heuristically cached page.
- Tooling change: `.\scripts\clueso.ps1 -Action VerifyRuntime` re-runs only the
  live-stack assertions without rebuilding or recreating containers.
- The second interrupted run left the web container created but not started;
  it was restarted and the stack re-verified. All three services are healthy.
- No Git writes, other-project changes, recording/publishing implementation, or
  Phase 2 work. This is original art direction, not a claimed design award.

## Previous update: editorial / motion-led redesign (superseded)

- The user wanted an Awwwards-style creative direction, not a polished admin
  dashboard. The previous sidebar/card-grid design has been replaced.
- New composition: poster-scale type, warm-paper/ink/lime palette, original
  ribbed SVG loop, pointer-responsive depth, moving type strip, high-contrast
  storytelling sections, interactive specimen preview, and a quieter live lab.
- Motion is explicitly pausable and automatically disabled for system reduced
  motion. No WebGL, animation framework, remote artwork, or cloud service added.
- Anton and variable Manrope are pinned at 5.3.0, from OFL-1.1 packages. Fonts
  load locally; Vite emits small assets as files to preserve the original CSP.
- Passed: Prettier, ESLint, TypeScript, production build, **15 frontend tests**,
  and **9 real Chromium tests**.
- Final browser run: `2026-11-12T00:44:00.949Z`, duration 81870.068 ms; 9 passed,
  0 skipped, 0 unexpected, 0 flaky, with no automatic retries.
- Eight essential-text targets: minimum contrast **5.15:1**. This remains a
  focused measurement, not a claim of full accessibility conformance.
- Desktop cover, full-page composition, and mobile screenshots were inspected.
  Layout tests cover 320, 520, 760, 768, 1024, and 1440px widths.
- The backend, API client/contracts, Compose infrastructure, CSP, and orchestration
  scripts are unchanged. Only the web service was recreated; all three Clueso
  runtime services remain healthy on the assigned ports.
- Two new source components: the motion artwork and the extracted live lab.
  Current source/documentation inventory: 60 files.
- No Git writes, other-project changes, recording/publishing implementation,
  or Phase 2 work. This is original art direction, not a claimed design award.

## Earlier update: tutorial-studio UI (superseded)

- Replaced the sparse dashboard with a responsive studio layout, vivid showcase,
  original CSS/SVG artwork, richer status feedback, and an interactive synthetic
  Capture/Detect/Review storyboard.
- Added keyboard tab navigation, mobile menu/Escape handling, expandable JSON
  output, a clear-result action, reduced-motion support, and readable text.
- UI validation passed: Prettier, ESLint, TypeScript, production build,
  **14 frontend tests and 7 real Chromium tests**.
- Final browser run started `2026-11-11T19:44:55.938Z`: 7 passed, 0 skipped,
  0 unexpected, 0 flaky in that run; observed duration 117529.147 ms.
- Eight essential text targets measured at least **5.23:1** contrast against
  their solid backgrounds. This is a focused check, not an accessibility audit.
- Layout checks passed at 320, 520, 760, 768, 1024, and 1440px widths.
- Backend, API contract, infrastructure, dependency manifests and lockfile
  remain unchanged. Only the web runtime container was recreated.
- Git metadata was observed during handoff, created outside this UI task.
  Read-only status contains exactly the expected 11 modified and 2 new files;
  no conflicting edits were found. No Git writes were performed.
- Live UI: <http://localhost:18109>. All three Clueso runtime services are healthy.
- No recording/diff/publishing feature was implemented; Phase 2 remains unstarted.

## Initial Phase 0/1 baseline

- Scope: Clueso only; Phase 0 and Phase 1.
- Initial state: engineering PDF only, no Git repository or application files.
- Guide: all 3 pages read completely before implementation.
- Phase 0: contract/safety documents and local CI definition authored.
- Phase 0 exception: Git initialization deferred because it is not authorized.
- Phase 1: **implemented and locally verified**. No later phase was started.
- Docker: Engine 29.4.1 and Compose 5.1.3 responding with Linux backend;
  observed 22 CPUs and 16,467,517,440 bytes daemon memory.
- Initial isolation: no `clueso` containers, no listeners on 18109/18209.
- Toolchain: container Node v22.23.4 verified; Maven/Java image available.
- Initial full verification: `.\scripts\clueso.ps1 -Action Verify`, exit 0,
  `2026-11-11T17:35:55.8655805Z` to `2026-11-11T17:40:25.4526581Z`.
- Passed: Prettier, ESLint, TypeScript, Vite production build, Spotless,
  Java compilation/package, **18 Java tests**, **12 frontend tests**, and
  **4 real Chromium E2E tests**.
- Live dashboard: <http://localhost:18109>. Live API:
  <http://localhost:18209/actuator/health/readiness>.
- Runtime: three healthy containers, project `clueso`, only loopback 18109/18209
  published, no PostgreSQL host port. Combined runtime limits: 640 MiB / 1.35 CPU.
- Test PostgreSQL is stopped; one-shot tooling containers exit and are removed.
- Real database stop/recovery passed: readiness and diagnostic become 503,
  liveness stays 200, then the web/API/database request recovers to 200.
- V1 remains applied exactly once after database/API restarts, with unchanged
  creation timestamp and checksum `-1736645511`.
- Structured diagnostic logs contain trace/span IDs and no diagnostic label or
  local database secret.
- Generated Node dependencies use a Clueso-owned volume after a Windows
  bind-mount permission failure. No host tools or permissions were changed.
- No cloud, real data, Git actions, destructive operations, or other sessions.

## Blockers and explicit limitations

- No remaining blocker for the verified Phase 1 local skeleton.
- The bloom and 60,000-particle path only runs on a hardware GPU. It was
  inspected manually on one machine and one browser engine; it is not covered by
  the automated suite, which uses a software renderer inside a container.
- Text contrast is measured for twelve selectors against solid backgrounds.
  Text that sits over the moving particle field is not measured automatically.
- Other browsers, low-end or mobile GPUs, 4K displays, and full accessibility
  conformance are unverified. The backing-store cap and adaptive particle
  reduction are implemented and unit-tested where pure, not benchmarked.
- One intermediate UI browser run hit two fixture-teardown timeouts. Both cases
  passed unchanged in a focused rerun, then all seven passed together without
  relaxed timeouts or disabled tracing. See the retained verification history.
- Existing Git metadata is left untouched; Git writes/publishing still need
  separate approval. Remote CI is authored but was not executed.
- Fresh Git clone, clean-volume reset, cloud deployment, vulnerability audit,
  and production suitability were not claimed or tested.
- Recording, domain permissions, diffing, selective re-recording, publishing,
  agents, and benchmarks are **not implemented**.
- Web/API have an ingress network permitting egress, but no external application
  integrations are configured. PostgreSQL stays private.
- Existing generated host dependencies from the interrupted install were not
  manually deleted; active tooling uses the isolated dependency volume.

## Next authorized-work boundary

Stop here. The next phase is **Phase 2: core data and APIs**: domain model,
permissions, idempotency, state transitions, and integration tests. It requires
a new instruction; no recording or publishing feature should bypass safety gates.

See [PLAN.md](PLAN.md) for the phase gate and
[VERIFICATION.md](VERIFICATION.md) for observed evidence.
All source additions are listed in [CHANGED_FILES.md](CHANGED_FILES.md).
