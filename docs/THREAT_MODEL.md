# Threat model and safety gates

## Scope and assets

Phase 1 is a localhost-only development skeleton with synthetic labels and a
platform metadata row. Assets are the local workstation, Docker resources,
database secret, source files, and integrity of test/verification evidence.

There are no real users, recordings, browser sessions, tutorial content, or
publishing credentials. This is a design threat model, not a completed security
audit or production approval.

## Trust boundaries

1. Untrusted browser/HTTP input enters the web proxy and API.
2. The API accesses a private PostgreSQL service using a local secret file.
3. Build tools obtain public dependencies outside the private database network.
   Web/API have a separate ingress network for localhost publication; egress is
   technically possible, but no external application integration is configured.
4. Other concurrent projects share Docker but must not share project resources,
   port allocations, secrets, volumes, or lifecycle commands.

## Risks and planned Phase 1 controls

| Threat                               | Control and verification                                                                                                                                                                     |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Recording unauthorized applications  | No URL, recording, upload, or publishing endpoint exists. Those interfaces are blocked until later-phase authorization design and tests.                                                     |
| Real data or credentials leaking     | Synthetic labels only; request bodies and DB secrets are not logged; generic problem details and hidden health details; local secret excluded from Git/build contexts.                       |
| SQL or markup injection              | Strict validated label, no SQL interpolation, fixed metadata query, React text rendering, CSP/security headers. Negative request tests cover invalid characters.                             |
| Unbounded input/resource use         | 64-character contract, bounded JSON parsing, web body limit, finite frontend request timeout, container CPU/memory/PID limits, one browser worker. Rate limiting is deferred and documented. |
| Cross-project interference           | Every command targets Compose project `clueso`; fixed loopback ports 18109/18209; no DB publication, global prune, global stop, Docker socket mount, or shared volume names.                 |
| External access/SSRF                 | No URL input or arbitrary destinations; database stays internal; web/API ingress permits egress but no external scripts/fonts/assets or telemetry exporter are configured.                   |
| Spoofed readiness                    | Readiness checks both connectivity and the migrated singleton. Liveness is separate.                                                                                                         |
| Silent failure or fabricated success | Non-2xx failures are explicit; response structure is checked by the frontend; test failures stop verification; evidence records actual results.                                              |
| Unsafe reset or unapproved delivery  | Flyway clean disabled; no volume deletion, Git initialization/commit/remote/push, cloud operation, or real-data access.                                                                      |
| Dependency/supply-chain risk         | Published version/peer checks, npm lockfile, pinned build-image identities where available, container-only tooling; no claim of a full dependency audit.                                     |
| Client GPU exhaustion or fingerprint | The particle field caps its backing store, reduces particles and then drops bloom on slow frames, and uses a light profile on software renderers. The renderer string is read locally only.  |
| Stale interface after a redeploy     | The HTML shell is served `no-cache`; hashed assets cannot be mismatched with an old shell. Verified from the live response headers.                                                          |

## Required gates for later phases

- Recording must require explicit authorization for each target.
- Target networking must block private/metadata/internal destinations by default
  and revalidate redirects and resolved addresses.
- Sensitive content must be masked before storage, screenshots, logs, or export.
- Publishing must require a distinct human approval; generating a preview is not
  permission to publish.
- Authentication, authorization, tenant isolation, idempotency, retention, audit
  events, and worker sandboxing precede domain writes and browser workers.
- No real data, production resources, or cloud cost without separate approval.

## Residual limitations

Any process with access to this workstation can call localhost endpoints.
There is no authentication, TLS, per-user rate limit, multi-tenant isolation, or
production-grade secret manager. The skeleton must not be exposed to a LAN or the
Internet. Container limits are not a claim of a hardened hostile-code sandbox.
Remote CI, vulnerability scanning, production security, and all recording and
publishing controls remain unverified until explicitly implemented and tested.

The redesign adds one runtime dependency (`lenis`, MIT) and one font package
(Instrument Serif, OFL-1.1), both pinned in the lockfile and served from the
same origin. It adds no network destination, storage, cookie, or telemetry, and
the Content-Security-Policy is unchanged. The WebGL renderer string is used only
to choose a rendering tier in the browser; it is not sent, logged, or stored.
Shader and GPU drivers are outside this project's control: the field falls back
to static artwork if WebGL2 or a shader is unavailable, but driver defects on
untested hardware remain possible.
