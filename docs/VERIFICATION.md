# Verification evidence

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
The original engineering PDF is unchanged. There is no Git repository, diff,
commit, branch, or remote; "changed files" means additions relative to the initial
PDF-only directory.

## Unverified / deferred

- Git initialization, GitHub Actions execution, fresh Git clone and destructive
  clean-volume resets.
- Other browsers, production hardening, load/chaos campaigns beyond the bounded
  DB outage smoke check, vulnerability scanning, and performance benchmarks.
- Domain entities/permissions and all recording, replay, diffing, publishing,
  agent and cloud functionality.

Next phase is Phase 2. No Phase 2 code has been started.
