# Verification evidence

## Latest: immersive WebGL direction

The editorial page was replaced by a scroll-choreographed experience around one
WebGL2 particle field (see [PRD.md](PRD.md) and decisions D18-D25). Everything
below was observed on 2026-11-12 against the final sources and the build that is
currently served, bundle `index-CNkjLYPm.js`. No award-site asset or layout was
copied and no award is claimed.

### Observed final results

| Check                          | Result                                                                                                                                         |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Prettier / ESLint / TypeScript | Pass                                                                                                                                           |
| Frontend tests                 | 4 files, 23 passed                                                                                                                             |
| Production build               | 31 modules, CSS 27.98 kB / 7.07 kB gzip, JS 287.56 kB / 90.34 kB gzip                                                                          |
| Java                           | 18 passed (3 integration against real PostgreSQL, 15 controller), `BUILD SUCCESS`                                                              |
| Chromium suite                 | 11 passed, 0 skipped/unexpected/flaky; 1 worker; no automatic retries                                                                          |
| Browser run                    | Started `2026-11-12T14:44:48.752Z`, duration 88505.608 ms                                                                                      |
| Field tier in the suite        | `running / software / glow off`: the lighter profile, which has no bloom                                                                       |
| Live-stack assertions          | 30 passed, `14:46:37Z` to `14:48:09Z`, including the real database outage and recovery                                                         |
| Served build                   | `index-CNkjLYPm.js` and `index-Ek2m4cSK.css`, identical to `apps/web/dist`                                                                     |
| Response headers               | `Cache-Control: no-cache` on the shell; Content-Security-Policy unchanged; `nosniff`, `no-referrer`, `DENY` present                            |
| Real diagnostic                | Four-field response through the proxy; invalid input rejected without echo; visible network failure and explicit retry; JSON disclosure; reset |
| Workflow                       | Keyboard navigation without requests; scrolling the pinned section selects Capture, Detect, then Review                                        |
| Motion                         | Pause, resume, and live system reduced-motion changes pass; smooth scrolling is active only while motion runs                                  |
| Fonts                          | Local WOFF2 requests observed, no external request, no console error                                                                           |
| Layout                         | No horizontal overflow at 320, 520, 760, 768, 901, 1024, 1440px                                                                                |
| Contrast                       | Twelve targets pass 4.5:1 against their solid backgrounds; minimum observed 8.26:1                                                             |
| GPU inspection                 | Every section rendered and reviewed on Intel Arc integrated graphics; see below                                                                |

### How the pipeline was actually completed

`.\scripts\clueso.ps1 -Action Verify` did **not** complete in a single
invocation. The host entered Modern Standby during both attempts, and the
remaining stages were then run individually. Nothing was skipped, but this is
not the same as one uninterrupted run and is recorded as such.

1. First attempt, against the build before the backing-store cap: every stage
   passed up to the final recovery wait after the database outage. Windows
   logged "entering Modern Standby" at `09:51:30Z`; the wait started at
   `09:56:19Z`, a session transition was logged at `09:56:23Z`, and "exiting
   Modern Standby" at `11:39:18Z`. The 180-second health wait had expired:
   exit 1. The containers themselves had restarted correctly and were healthy.
2. Second attempt, against the final sources, started `11:41:06Z`. Windows had
   already logged "entering Modern Standby" at `11:40:13Z`. Dependency check,
   `format:check`, lint, typecheck, 23 unit tests, the production build, 18 Java
   tests, and both image builds passed. The runtime health wait started at
   `11:44:39Z`; the host resumed at `14:42:13Z` and the command exited 1 at
   `14:42:17Z` with "dependency api failed to start: timeout waiting for
   dependencies". This time the interrupted `up` had recreated the web container
   without starting it: **the site was down** until the next step.
3. `14:44Z`: `up --detach --wait --wait-timeout 120 db api web` exited 0. Web
   returned 200, readiness `UP`, and the real check returned its four fields.
4. `14:44:45Z` to `14:46:17Z`: the browser suite, 11 passed.
5. `14:46:37Z` to `14:48:09Z`: `.\scripts\clueso.ps1 -Action VerifyRuntime`,
   exit 0, 30 assertions printed `PASS`: host health and contract, exactly three
   containers, project labels, CPU/memory/PID limits, loopback-only ports,
   non-root users, no PostgreSQL port, internal runtime network, Flyway V1
   applied once, readiness 503 and liveness 200 and an explicit 503 problem
   during a real database stop, unchanged metadata and checksum after restart,
   recovered round trip, parseable structured logs with a trace ID, and no
   secret or label in the logs. The `PASS` lines are console output; the
   machine-written record is `runtime-results.json`, which the script writes
   only after every assertion has passed.

`verification-summary.json` still records the second attempt as failed, which is
accurate for that invocation and was left untouched. No host power setting was
changed. A rerun of the single command needs the machine to stay awake for
roughly eight minutes.

### GPU inspection: method, numbers, limits

The automated suite has no GPU, so the 60,000-particle and bloom path was
checked by hand in the VS Code integrated browser on this machine.

- Renderer: Intel Arc Pro Graphics through ANGLE on Direct3D 11; the full
  renderer string is in the handoff summary. Viewport 1024x768 CSS px at 1.5x;
  canvas 1521x1152.
- Final bundle: `data-renderer="hardware"`, `data-glow="on"`, 60,000 live
  particles, and `gl.getError()` returned 0 after the intro and about 390
  frames. `EXT_color_buffer_float` is present in this browser, so the glow uses
  half-float targets.
- Reviewed as screenshots with the final screen-blended bloom: the hero (again
  on the final bundle) and Review. Reviewed with the earlier additive bloom:
  the stale frame at the end of the headline reveal, Capture, and the lab before
  and after a real `200 OK` check. Reviewed before any bloom: Detect and the
  footer. The screen blend can only lower the additive result, but those
  sections were not looked at again after the change.
- Frame cost: 3.58 ms per frame before the bloom and 3.73 ms with it, on the
  builds before and after the bloom was added, taken as the slope between
  10-frame and 40-frame batches that each end in a synchronous `readPixels`.
- The integrated browser tab was in the background (`visibilityState: hidden`),
  where animation frames do not fire. Frames were therefore driven from the
  inspection harness by replacing `requestAnimationFrame` in that page only; the
  product code was not changed for this. Consequences: the numbers are GPU and
  script cost per frame, not an observed on-screen frame rate; pointer-driven
  tilt, the cursor, magnetic buttons, and smooth wheel scrolling were **not**
  watched live on the GPU; and the host was running other projects' workloads at
  the time, so the figures are indicative, not a benchmark.

Findings from that review that were fixed and re-inspected: the default light
scrollbar, the stale-frame form running under the HUD at 1024px, the console
leaving half the lab empty at 1024px, and the check-mark stroke blowing out to
white once the bloom was added.

### Exact commands

```powershell
.\scripts\clueso.ps1 -Action Format
.\scripts\clueso.ps1 -Action Verify
docker compose --project-name clueso --file .\infra\docker\compose.yaml up --detach --wait --wait-timeout 120 db api web
docker compose --project-name clueso --file .\infra\docker\compose.yaml run --rm --no-deps e2e
.\scripts\clueso.ps1 -Action VerifyRuntime
```

During iteration the same checks were run directly:

```powershell
docker compose --project-name clueso --file .\infra\docker\compose.yaml run --rm --no-deps node-tool sh -lc 'npm run format && npm run lint && npm run typecheck && npm test && npm run build'
docker compose --project-name clueso --file .\infra\docker\compose.yaml build web
docker compose --project-name clueso --file .\infra\docker\compose.yaml up --no-deps --detach --wait --wait-timeout 120 web
```

Dependencies changed once, through the web manifest: `lenis@1.3.27` (MIT) and
`@fontsource/instrument-serif@5.3.0` (OFL-1.1) added, `@fontsource/anton`
removed; the lockfile was regenerated in the Node tool container and later
restored with `npm ci`. Host Node/Java and global settings were not changed.

### Failures found and fixed

1. The vertex shader used `active` as a variable name, a reserved word in GLSL
   ES 3.0; the program failed to compile and the page fell back to static
   artwork. Renamed.
2. ESLint's React purity rule rejected `performance.now()` in component scope.
   Timing moved into effect and frame callbacks.
3. After a redeploy the browser kept an old `index.html`. The shell is now
   served `no-cache` (D24).
4. `prettier .` took more than ten minutes walking ignored caches under
   `.local`. The format scripts now name their directories; 38 files at the
   time, seconds.
5. With a software renderer the first version made five browser tests time out
   on fill rate. The lighter profile (D21) fixed it without relaxing a test.
6. On the GPU the bloom whitened the dense check-mark stroke. A screen blend and
   a lower brightness for that form restored the particle texture (D22).
7. At 1024px the stale-frame form ran under the HUD and the console left the lab
   half empty. Fitted placement (D23) and a two-column lab down to 901px.
8. One browser run on a saturated host (94% CPU, another project's browser
   container at 104%) took 4.4 minutes and timed out twice: the mobile test in
   context teardown and the particle tour after its last screenshot. The
   unchanged suite then passed 11/11 in 1.6 minutes. The timeout is now 60
   seconds as margin; retries remain off.
9. Two `Verify` runs were cut by host standby, as described above. The second
   left the web container created but not started; it was restored and
   `VerifyRuntime` was added so the interrupted stage can be resumed (D25).

### Persistent evidence

- [final pipeline log](../.local/evidence/immersive-verify.log) and
  [its exit record](../.local/evidence/immersive-verify-exit.txt)
- [interrupted runtime start](../.local/evidence/runtime-up.log)
- [every Docker command with exit codes](../.local/evidence/commands.jsonl)
- [browser run](../.local/evidence/immersive-e2e.log) and
  [its report](../.local/evidence/immersive-e2e-results.json)
- [live-stack command output](../.local/evidence/immersive-verify-runtime.log),
  [exit record](../.local/evidence/immersive-verify-runtime-exit.txt), and
  [observed runtime state](../.local/evidence/runtime-results.json)
- [measured text contrast](../.local/evidence/immersive-contrast.json)
- [GPU-rendered hero](../.local/evidence/immersive-gpu/hero.png)
- [software-tier tour and mobile captures](../.local/evidence/immersive-tour/)
- [handoff summary](../.local/evidence/immersive-summary.json) and
  [source hashes](../.local/evidence/immersive-source-inventory.json)

These are observed test and build results, not product benchmarks or a
design-quality score. Unverified: other browsers and engines, mobile and low-end
GPUs, displays large enough to engage the backing-store cap, text contrast over
the moving field, full accessibility conformance, and the future tutorial engine.

## Previous: editorial / motion-led redesign (superseded)

The user clarified that the previous polished dashboard did not meet the desired
creative direction. The replacement is an original editorial microsite:
poster-scale type, paper/ink/lime palette, an original SVG motion sculpture,
pointer-responsive depth, a pausable type strip, and scroll-led storytelling.
No specific award-site assets or layouts were copied; no award is claimed.

### Observed final results

| Check                          | Result                                                                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Prettier / ESLint / TypeScript | Pass                                                                                                                      |
| Frontend tests                 | 2 files, 15 passed                                                                                                        |
| Production build               | 23 modules, CSS 44.61 kB / 10.42 kB gzip, JS 248.99 kB / 76.92 kB gzip                                                    |
| Chromium suite                 | 9 passed, 0 skipped/unexpected/flaky; 1 worker; no automatic retries                                                      |
| Browser run                    | Started `2026-11-12T00:44:00.949Z`, duration 81870.068 ms                                                                 |
| Motion                         | Actual pointer tilt, manual pause/resume, and live reduced-motion preference changes pass                                 |
| Font delivery                  | Anton and Manrope are actually loaded, local WOFF2 requests observed, no external asset request or console error          |
| Real diagnostic                | Exact four-field API/database response, invalid-input handling, visible network failure/retry, JSON disclosure/reset pass |
| Preview                        | Keyboard navigation works without sending mutation requests; all scenes are labelled synthetic                            |
| Layout                         | No horizontal overflow at 320, 520, 760, 768, 1024, 1440px                                                                |
| Contrast                       | Eight essential-text targets pass 4.5:1; minimum observed 5.1491:1                                                        |
| Visual inspection              | Desktop cover, full-page editorial composition, and mobile capture inspected                                              |
| Scope                          | API/backend, infrastructure, CSP, API client/contracts and orchestration scripts unchanged                                |

Only the web runtime service was recreated. Existing runtime CPU/memory/PID
limits and localhost ports remain unchanged. Java and database-outage results
below are historical baseline results, not newly rerun for this frontend-only task.

### Exact commands

```powershell
docker compose --project-name clueso --file .\infra\docker\compose.yaml run --rm --no-deps node-tool npm install --no-audit --no-fund
docker compose --project-name clueso --file .\infra\docker\compose.yaml run --rm --no-deps node-tool sh -lc 'npm run format:check && npm run lint && npm run typecheck && npm test && npm run build'
docker compose --project-name clueso --file .\infra\docker\compose.yaml build web
docker compose --project-name clueso --file .\infra\docker\compose.yaml up --no-deps --detach --wait --wait-timeout 120 web
docker compose --project-name clueso --file .\infra\docker\compose.yaml run --rm --no-deps e2e
```

The install followed the explicit web dependency-manifest change and added only
`@fontsource/anton@5.3.0` and `@fontsource-variable/manrope@5.3.0`. Registry metadata
declares both OFL-1.1. Host Node/Java and global settings were not changed.

### Failures found and fixed

1. The initial browser-font test used `Array.from(FontFaceSet)` without iterable
   DOM types. It now uses typed `FontFaceSet.forEach`; test registration was also
   corrected before the browser run. No unsafe cast or broader TS relaxation.
2. The Manrope package does not ship the assumed Latin CSS entry. Inspecting the
   installed package identified its real `index.css` entry, which is now used.
3. The first real browser run passed eight tests but reported a CSP violation for
   a small font Vite had inlined as a data URL. Setting `assetsInlineLimit: 0`
   emits that 2.55 kB WOFF2 as a local file. The original CSP was **not** weakened.
   The final complete nine-test run passes, including zero console errors.

### Persistent editorial evidence

- [editorial-checks.log](../.local/evidence/editorial-checks.log)
- [editorial-font-install.log](../.local/evidence/editorial-font-install.log)
- [editorial-checks-initial.log](../.local/evidence/editorial-checks-initial.log)
- [editorial-font-entry-failure.log](../.local/evidence/editorial-font-entry-failure.log)
- [editorial-web-build.log](../.local/evidence/editorial-web-build.log)
- [editorial-e2e.log](../.local/evidence/editorial-e2e.log)
- [initial browser CSP failure](../.local/evidence/editorial-e2e-font-csp.log)
- [preserved final browser report](../.local/evidence/editorial-e2e-results.json)
- [measured text contrast](../.local/evidence/editorial-contrast.json)
- [desktop cover](../.local/evidence/browser/smoke-production-browser---proxy---API---migrated-PostgreSQL/cover.png)
- [full desktop composition](../.local/evidence/browser/smoke-production-browser---proxy---API---migrated-PostgreSQL/desktop.png)
- [mobile composition](../.local/evidence/browser/smoke-mobile-layout-suppor-1ecd3-without-horizontal-overflow/mobile.png)
- [editorial handoff](../.local/evidence/editorial-summary.json)
- [editorial source hashes](../.local/evidence/editorial-source-inventory.json)

The figures above are observed test/build results, not product benchmarks or an
objective design-quality score. Other browsers, full accessibility compliance,
and the future tutorial engine remain unverified/unimplemented.

## Earlier: tutorial-studio UI refinement (superseded)

The UI-only refinement preserves the existing backend and safety boundaries.
It introduces a vivid studio layout, original CSS/SVG artwork, a clearly labelled
synthetic Capture/Detect/Review preview, mobile navigation, keyboard interaction,
JSON disclosure/reset, and more readable diagnostic feedback.

### Exact UI verification commands

Run from `C:\Users\upadhsah\Desktop\project\Clueso`:

```powershell
docker compose --project-name clueso --file .\infra\docker\compose.yaml run --rm --no-deps node-tool sh -lc 'npm run format && npm run format:check && npm run lint && npm run typecheck && npm test && npm run build'
docker compose --project-name clueso --file .\infra\docker\compose.yaml build web
docker compose --project-name clueso --file .\infra\docker\compose.yaml up --no-deps --detach --wait --wait-timeout 120 web
docker compose --project-name clueso --file .\infra\docker\compose.yaml run --rm --no-deps e2e
```

All completed successfully. No package installation or host-tool change was
required. The API and database containers were not restarted for this UI task.

| Check                        | Observed result                                                                               |
| ---------------------------- | --------------------------------------------------------------------------------------------- |
| Prettier, ESLint, TypeScript | Pass; application and test/tool types checked                                                 |
| Frontend tests               | 2 files, 14 passed                                                                            |
| Production build             | 19 modules; CSS 38.77 kB / 9.40 kB gzip, JS 247.76 kB / 75.79 kB gzip                         |
| Real Chromium suite          | 7 passed, 0 skipped, 0 unexpected, 0 flaky in the final run; 1 worker, 0 automatic retries    |
| Browser timestamp/duration   | Started `2026-11-11T19:44:55.938Z`; 117529.147 ms observed                                    |
| Real diagnostic              | Same exact four-field database-backed response; validation and network-error retry still pass |
| Preview safety               | Arrow/Home/End navigation changes only synthetic artwork/copy; no mutation request is sent    |
| Mobile navigation            | Menu opens/closes, Escape restores focus, section navigation closes the menu                  |
| Response controls            | JSON disclosure shows the real response; clear resets status without making a request         |
| Responsive layout            | No horizontal overflow at widths 320, 520, 760, 768, 1024, 1440                               |
| Essential text contrast      | All 8 selected real-DOM text targets >= 4.5:1; observed minimum 5.2285:1                      |
| Runtime                      | Web health `200 ok`, API readiness `200 UP`; three healthy Clueso services                    |
| Scope preservation           | Baseline hashes confirm unchanged backend, infrastructure, package manifests and lockfile     |

Desktop and mobile screenshots were visually inspected. Snapshot capture now
returns to the top before capture, avoiding misplaced sticky navigation in
full-page images. All artwork is original local markup; no external image/font
service, user data, or cloud integration is involved.

The contrast check measures eight essential text targets on solid backgrounds,
not all artwork/gradients or every accessibility requirement. It is **not** a
claim of full WCAG conformance.

### UI iteration and failure history

- The initial redesigned UI passed 14 unit tests and six browser tests.
- A visual check identified overly faint helper text. The semantic text palette
  and typography were improved, and a measured contrast test was added.
- One intermediate seven-test run had two failures during Playwright
  **context/request teardown**, not failed UI/API assertions. The two cases
  passed unchanged in a focused rerun, followed by the complete seven-test pass.
  Timeouts, tracing, resource limits, and assertions were not weakened. The
  intermittent teardown delay's underlying cause was not established.

Focused retry command:

```powershell
docker compose --project-name clueso --file .\infra\docker\compose.yaml run --rm --no-deps e2e npm run test:e2e -- --grep 'production browser|real API rejects'
```

Observed: 2 passed in 38.5 seconds. The subsequent complete run is the final
seven-test result above, not a combination of partial runs.

UI evidence:

- [ui-checks.log](../.local/evidence/ui-checks.log)
- [ui-image-build.log](../.local/evidence/ui-image-build.log)
- [ui-e2e.log](../.local/evidence/ui-e2e.log)
- [ui-e2e-teardown-timeout.log](../.local/evidence/ui-e2e-teardown-timeout.log)
- [ui-e2e-followup.log](../.local/evidence/ui-e2e-followup.log)
- [ui-contrast.json](../.local/evidence/ui-contrast.json)
- [latest browser report](../.local/evidence/e2e-results.json)
- [latest desktop/mobile captures](../.local/evidence/browser/)
- [UI handoff summary](../.local/evidence/ui-summary.json)
- [updated source hashes](../.local/evidence/ui-source-inventory.json)

The earlier sections below retain the original Phase 0/1 evidence. The latest
browser report and captures now describe this UI refinement; Java and
database-outage results below remain the earlier unchanged-backend baseline.
No later phase was started.

### Git metadata observation

The final safety check found `.git` metadata that did not exist at the original
Phase 0/1 handoff. It was created outside this UI task. Read-only
`git --no-pager status --short --untracked-files=normal`, with
`GIT_OPTIONAL_LOCKS=0`, showed exactly the expected 11 modified and 2 new UI/docs
files. No conflicting source edits were present. The metadata and index were
left untouched; this session made no commits or remote/push changes.

## Pre-implementation observations

Date: 2026-11-11. All commands were scoped to Clueso or read-only Docker/toolchain
inspection. The project initially contained only the engineering PDF.

| Check                       | Exact command / method                                                                                          | Observed result                                                                       |
| --------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Full guide                  | Python `pypdf.PdfReader`, `extract_text()` for every page; read page ranges 1-3 in full                         | 3 pages; SHA-256 `00268b4dddfc3ff2f03ca89ecc6e3c57b96711919293c39a971ed1117391141c`   |
| Docker daemon               | `docker version --format '{{json .}}'`                                                                          | Engine and client 29.4.1, Linux backend                                               |
| Compose                     | `docker compose version`                                                                                        | v5.1.3                                                                                |
| Capacity                    | `docker info --format 'CPUs={{.NCPU}} MemoryBytes={{.MemTotal}} OSType={{.OSType}}'`                            | 22 CPUs, 16467517440 bytes, linux                                                     |
| Existing project containers | `docker ps --filter 'label=com.docker.compose.project=clueso'`                                                  | None                                                                                  |
| Port availability           | `Get-NetTCPConnection -State Listen -LocalPort 18109,18209 -ErrorAction SilentlyContinue`                       | No listeners                                                                          |
| Node                        | `docker run --rm --network none --memory 128m --cpus 0.25 --pids-limit 64 node:22-bookworm-slim node --version` | v22.23.4                                                                              |
| Dependency compatibility    | Maven Central metadata and npm registry version/peer metadata                                                   | Spring Boot 3.5.16 exists; TypeScript ESLint excludes TypeScript 7, so 5.9.3 selected |

Source generation, image availability, and package metadata are **not**
successful build/test or security evidence.

## Initial formatting and setup

```powershell
.\scripts\clueso.ps1 -Action Setup
docker compose --project-name clueso --file .\infra\docker\compose.yaml run --rm --no-deps maven-tool mvn -B -ntp spotless:apply
```

- Initial npm setup completed: 219 packages, reported 57 minutes on the Windows
  bind mount. A later lockfile restore into the isolated dependency volume
  completed with 221 packages in 11 seconds.
- Node-container registry connectivity was tested: `https://registry.npmjs.org/react`
  returned HTTP 200. Maven-container connectivity to the selected Spring Boot
  parent POM also returned HTTP 200.
- Java formatting completed with `BUILD SUCCESS`: 10 files formatted, 0 failures,
  reported Maven duration `33:46 min`. This measures the cold dependency/setup
  command, not API or product performance.
- The isolated PostgreSQL test service became healthy; it is stopped after tests.
- PowerShell orchestration scripts parsed without syntax errors.
- Immutable runtime/browser image manifest digests were resolved and pinned.

## Final complete verification

Executed from `C:\Users\upadhsah\Desktop\project\Clueso`:

```powershell
.\scripts\clueso.ps1 -Action Format
.\scripts\clueso.ps1 -Action Verify
```

Full Verify result: **exit 0 / passed**.
Started `2026-11-11T17:35:55.8655805Z`, finished
`2026-11-11T17:40:25.4526581Z`. These are observed tool timestamps, not product
benchmarks.

The documented `.\scripts\clueso.ps1 -Action Up` was also executed after final
documentation formatting and completed with exit 0 and three healthy services.
It intentionally packages with `-DskipTests`; the test results below are from
`Verify`, not from `Up`. This checked startup with the existing preserved volumes,
not a Git clone or destructive data reset.

| Check                             | Observed result                                                                                          |
| --------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Prettier                          | All matched files use Prettier code style                                                                |
| ESLint                            | Exit 0, no reported violations                                                                           |
| TypeScript                        | Application plus tool/test configurations pass                                                           |
| Frontend unit tests               | 2 files, 12 tests passed                                                                                 |
| Frontend production build         | Vite build and type-check passed                                                                         |
| Spotless                          | 10 Java files clean                                                                                      |
| Java compilation/package          | Java 21 compilation and executable Spring Boot JAR passed                                                |
| Real-PostgreSQL integration tests | 3 passed, 0 failed/skipped                                                                               |
| Controller/validation tests       | 15 passed, 0 failed/skipped                                                                              |
| Total Java tests                  | 18 passed, 0 failures/errors/skips; Maven BUILD SUCCESS                                                  |
| Chromium smoke tests              | 4 passed, 0 retries, 1 worker; reported 10.3 seconds                                                     |
| Runtime health                    | Web/API/PostgreSQL all healthy                                                                           |
| Host HTTP                         | Web `/healthz` 200 `ok`; liveness/readiness 200 `UP`                                                     |
| Actual port publication           | Only `127.0.0.1:18109` and `127.0.0.1:18209`; DB has no published port                                   |
| Container isolation               | All runtime containers labelled `clueso`; DB attached only to the internal network; web/API non-root     |
| Database outage                   | Stopping only `clueso` DB yields readiness 503 `DOWN`, diagnostic 503 problem details, liveness 200 `UP` |
| Recovery/persistence              | DB/API restart restores successful round trip; metadata timestamp, V1 count and checksum unchanged       |
| Logging                           | Observed structured JSON with trace/span IDs; tested synthetic labels and local secret absent            |
| Responsive UI                     | Desktop and 390px mobile Chromium workflows passed; screenshots inspected; no mobile horizontal overflow |

No domain engine, recording benchmark, remote CI, production readiness, or full
security audit is implied by these results.

### Reproduce the underlying checks

The script runs these commands sequentially with explicit CPU/memory/PID limits:

```powershell
$compose = @("compose", "--project-name", "clueso", "--file", ".\infra\docker\compose.yaml")
docker @compose run --rm --no-deps node-tool npm run format:check
docker @compose run --rm --no-deps node-tool npm run lint
docker @compose run --rm --no-deps node-tool npm run typecheck
docker @compose run --rm --no-deps node-tool npm test
docker @compose run --rm --no-deps node-tool npm run build
docker @compose up --detach --wait --wait-timeout 120 test-db
docker @compose run --rm --no-deps maven-tool mvn -B -ntp verify
docker @compose stop test-db
docker @compose build api web
docker @compose up --detach --wait --wait-timeout 180 db api web
docker @compose run --rm --no-deps e2e
```

Use the script for normal verification: it checks exit codes, preserves logs,
stops the test DB in `finally`, and performs the additional real runtime
assertions in [verify-runtime.ps1](../scripts/verify-runtime.ps1).
`Verify` briefly stops and restarts **only Clueso's DB** for the outage test.
It leaves the recovered runtime healthy and preserves volumes.

### Actual application response

The host request to `http://127.0.0.1:18109/api/v1/system/check` with the synthetic
label `runtime-smoke` returned HTTP 200 and exactly:

```json
{
  "service": "clueso-api",
  "status": "ready",
  "label": "runtime-smoke",
  "schemaVersion": 1
}
```

The database outage response was HTTP 503, `application/problem+json`:

```json
{
  "type": "about:blank",
  "title": "Service unavailable",
  "status": 503,
  "detail": "The database is not ready. Try again shortly.",
  "instance": "/api/v1/system/check"
}
```

Flyway before and after restart:

- `schemaVersion = 1`
- `migrationCount = 1`, `v1Count = 1`
- `createdAt = 2026-11-11T17:29:08.954829+00:00`
- `checksum = -1736645511`

One observed diagnostic event: `system_check_completed schema_version=1`,
trace ID `4de360a30d3344dd6d2ae8f521b3c217`, span ID `43db81953d0fc052`.

### Resource observations

| Service | CPU limit | Memory limit | PID limit | Observed post-test memory |
| ------- | --------- | ------------ | --------- | ------------------------- |
| DB      | 0.35      | 192 MiB      | 128       | 16.09 MiB                 |
| API     | 0.75      | 384 MiB      | 128       | 158.2 MiB                 |
| Web     | 0.25      | 64 MiB       | 64        | 2.367 MiB                 |

Combined runtime caps: **1.35 CPU / 640 MiB**. Tool containers run sequentially:
Node 1 CPU/768 MiB, Maven 1 CPU/1024 MiB, Playwright 1 CPU/1024 MiB, and test DB
0.35 CPU/192 MiB. Snapshot usage is not a benchmark or a guaranteed footprint.

## Failures encountered and resolved

| Observed failure                                                           | Root cause / correction                                                                                               | Subsequent evidence                                            |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Three ESLint `preserve-caught-error` failures                              | Wrapped client errors omitted their causes; preserve `{ cause: error }`                                               | Final lint and 12 frontend tests pass                          |
| 1/18 Java tests failed: expected `Invalid JSON request`, got `Bad Request` | Spring's default problem handler took precedence; make the specific advice highest precedence                         | All 18 tests pass; safe validation log events observed         |
| Both second reruns ended with Docker `unexpected EOF` / exit 125           | Docker connection was interrupted; no completed result claimed; daemon later responded                                | Re-ran sequentially without changing daemon settings           |
| `npm ci` EACCES removing a generated dependency                            | Windows bind-mount replacement failed; generated Node dependencies now use `clueso_node_modules`                      | Lockfile restore and every frontend/browser command passed     |
| `all predefined address pools have been fully subnetted`                   | Concurrent projects exhausted default Docker pools; explicit small new runtime/edge subnets avoid the pool            | Only Clueso networks created; startup and host checks pass     |
| In-network E2E passed, but host ports refused connections                  | Docker 29 left actual bindings empty for internal-only networks; add Clueso edge network for web/API                  | Actual host 200 responses and inspected loopback mappings pass |
| Runtime script incorrectly counted one container instead of three          | Windows PowerShell wrapped JSON's array in another array; remove redundant wrapping                                   | All three containers now asserted individually                 |
| Tool network reconciliation referenced a container not connected to it     | Changing IPAM on existing networks triggered Compose reconciliation failure; retain existing tooling/test allocations | Full script passes with no network/volume reset                |

The original blanket no-egress claim was corrected: web/API's ingress network
permits egress, while the DB remains private. No external application calls,
real data, cloud services, or telemetry exports were used.

## Persisted evidence and inventory

All evidence is under the ignored project-local
[.local/evidence](../.local/evidence/):

- [verification-summary.json](../.local/evidence/verification-summary.json):
  final pass status and timestamps.
- [commands.jsonl](../.local/evidence/commands.jsonl): actual Docker command strings,
  argument arrays, timestamps, exit codes and associated log files. Historical
  failures remain; latest successful run is identified above.
- [runtime-results.json](../.local/evidence/runtime-results.json): real responses,
  actual limits/port bindings, V1 persistence and the observed trace event.
- [e2e-results.json](../.local/evidence/e2e-results.json): complete browser result.
- [api-tests.log](../.local/evidence/api-tests.log) and
  [web-tests.log](../.local/evidence/web-tests.log): actual test output.
- [browser screenshots](../.local/evidence/browser/): successful desktop/mobile
  views, not mocked designs.
- [source-inventory.json](../.local/evidence/source-inventory.json): source file
  paths and SHA-256 digests after final documentation formatting.

See [CHANGED_FILES.md](CHANGED_FILES.md) for the human-readable source inventory.
The original engineering PDF is unchanged. At the original Phase 0/1 handoff,
there was no Git repository; "changed files" meant additions relative to the
initial PDF-only directory. Git metadata subsequently appeared outside this
session's work; see the UI handoff observation above.

## Unverified / deferred

- Git initialization, GitHub Actions execution, fresh Git clone and destructive
  clean-volume resets.
- Other browsers, production hardening, load/chaos campaigns beyond the bounded
  DB outage smoke check, vulnerability scanning, and performance benchmarks.
- Domain entities/permissions and all recording, replay, diffing, publishing,
  agent and cloud functionality.

Next phase is Phase 2. No Phase 2 code has been started.
