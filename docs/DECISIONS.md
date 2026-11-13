# Decisions

| ID  | Decision                                                                   | Rationale / consequence                                                                                                                                                 |
| --- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D01 | Implement only Phase 0 then Phase 1.                                       | The complete three-page guide was read, but later prompts do not expand the authorized scope.                                                                           |
| D02 | Use Java 21, Spring Boot 3.5.16, React/TypeScript, PostgreSQL 17, Compose. | Matches the guide; Maven Central confirms the 3.5.16 artifact. No alternative backend or unnecessary worker.                                                            |
| D03 | Use containerized Node 22 and Maven/Java 21.                               | Host Node 14 and missing host Java are not changed. Existing Node container is v22.23.4.                                                                                |
| D04 | Use TypeScript 5.9.3 rather than registry-latest 7.0.2.                    | Current TypeScript ESLint 8.72.2 declares TypeScript >=4.8.4 and <6.1.0. Avoid an incompatible new major; lock dependencies.                                            |
| D05 | No Redis, Kafka, or browser worker in Phase 1.                             | A read-only diagnostic and relational metadata do not justify asynchronous infrastructure.                                                                              |
| D06 | One read-only diagnostic POST proves the vertical slice.                   | Request validation plus a real migrated DB read without prematurely implementing Phase 2 domain state. The label is never persisted.                                    |
| D07 | Same-origin web proxy, loopback publication only.                          | Avoids permissive CORS and respects concurrent session ports.                                                                                                           |
| D08 | Isolated test PostgreSQL, no Docker socket.                                | Tests cannot reset the application's database or control other projects through Testcontainers.                                                                         |
| D09 | Secrets generated locally and mounted as files.                            | No checked-in password; Spring config-tree import and Postgres password-file support consume the same secret. Missing secret is a setup failure, not a default.         |
| D10 | Structured logs with OpenTelemetry bridge, no exporter.                    | Trace context is useful now; no external telemetry, collector, or cloud spending is needed.                                                                             |
| D11 | Defer Git initialization.                                                  | Approval applied only to another project, not Clueso. Files and CI can be scaffolded without `.git`; no request for approval is necessary until a Git action is needed. |
| D12 | Preserve data; no automated down migration or volume deletion.             | V1 is additive, Flyway clean is disabled, and destructive resets are outside authorization.                                                                             |
| D13 | CI source only.                                                            | A local workflow is part of Phase 0, but executing GitHub Actions would require separate Git/remote authorization. Local equivalent commands will be verified.          |
| D14 | No benchmark numbers in Phase 1.                                           | Selective change detection, replay, and time-saved measurements require the later domain engine and fixtures.                                                           |

Version choices are explicit inputs, not proof of compatibility. Actual
format/build/test results belong in [VERIFICATION.md](VERIFICATION.md).

## D15 - generated Node dependencies use a Clueso-owned volume

After an external Docker interruption, `npm ci` failed with `EACCES` removing
`fast-json-stable-stringify` from the Windows bind-mounted dependency directory.
Node tooling and Playwright now share `clueso_node_modules`, populated from the
lockfile. No host permissions were changed and the failed generated host
dependency tree was not manually deleted. Application sources, build outputs,
secret files, cache, scripts, and evidence stay under Clueso.

This is a dependency-storage decision, not a new application service. Database
volumes and dependency volumes remain project-prefixed and are never pruned.

## D16 - explicit small, isolated local subnets

The first runtime start failed because Docker's predefined address pools were
fully allocated across concurrent projects. Read-only inspection of network
allocations and host routes found the Clueso block `198.18.109.0/24` available.
New runtime and edge networks use its `.0/28` and `.48/28` subnets.
Existing tooling/test networks retain their Docker-assigned subnets.

This reserved benchmarking range is used only inside local Docker networking,
not for Internet destinations or deployment. Runtime and test networks remain
internal. No Docker daemon settings, global network pools, routes, other project
networks, or volumes are changed. On another host, check for overlap before using
this local configuration.

## D17 - separate loopback ingress from the private database network

Real Chromium tests passed inside Docker, but host HTTP checks failed. Container
inspection showed requested port bindings with empty actual published-port lists:
Docker 29 does not publish ports for services attached only to internal networks.

Web/API now additionally use `clueso_edge` on `198.18.109.48/28`. Only loopback
18109 and 18209 are published; the database remains solely on the internal network.
This permits web/API egress at the network level, so the original blanket
no-egress claim has been removed. There are still no external application calls,
URL inputs, remote assets, or telemetry exports. Future browser workers need
their own stricter authorization and networking design.

Changing IPAM on the already-created tooling/test networks triggered a Compose
5.1.3 reconciliation failure referencing a container not connected to that
network. Those unnecessary IPAM edits were reverted; existing networks and
volumes were preserved. No global network cleanup was used.

## D18 - one raw WebGL2 particle field instead of a 3D library

The centerpiece is a single `POINTS` draw: six precomputed target positions per
particle as vertex attributes, with morphing, flight, pointer push, pulse ring
and depth blur computed in the vertex shader. That needs no scene graph, loader,
or material system, so a 3D library would add bundle weight and a large
dependency for one draw call. The engine is about 600 lines and owns its whole
lifecycle: resize, context loss and restore, adaptive quality, and disposal.

Consequence: the shaders and GL state are ours to maintain. Shape sampling and
placement are pure functions with unit tests; the GL code is exercised only in a
real browser.

## D19 - Lenis for smooth scrolling, driven by one shared ticker

Scroll position drives the field, the headline reveal, the pinned workflow and
the marquee, so they must agree on one frame clock. `lenis@1.3.27` (MIT) is
created with `autoRaf: false` and stepped by the same ticker as everything
else. It is enabled only with a fine pointer and only while motion is running;
touch devices, paused motion, and reduced motion use native scrolling. Its
package does not export its stylesheet, so the two rules it needs are in our
stylesheet.

## D20 - Instrument Serif replaces Anton

The display pairing is now variable Manrope with Instrument Serif italics, both
self-hosted from OFL-1.1 Fontsource packages. `@fontsource/anton` was removed.
Fonts remain local files because `assetsInlineLimit` stays at zero, which keeps
the existing CSP free of `data:` sources.

## D21 - software renderers get a lighter profile, not the same scene slower

With a software rasterizer the full scene made the page itself unresponsive: in
the one-CPU test container five browser tests timed out on fill rate alone. The
engine reads the unmasked renderer string locally and, for SwiftShader/llvmpipe
class renderers, uses 6,000 particles, a half-resolution backing store,
alternate frames, smaller blur sprites, and no bloom. The HUD always shows the
true live count. The renderer string never leaves the browser.

Consequence: the automated browser suite runs this lighter profile, so it does
not cover the GPU-only bloom path. That path is verified by manual inspection on
a GPU and is guarded by a fallback: any failure to build or size the glow
targets logs once and returns to direct rendering.

## D22 - bloom as downsample-and-blur passes with a screen blend

GPUs render the particles to an offscreen target, then a box downsample and
three separable blur levels (quarter, eighth, sixteenth resolution) are added
back over the scene. Half-float targets are used when `EXT_color_buffer_float`
is available so the dim end of the glow does not band; otherwise 8-bit targets
with dithering. The glow is combined with a screen blend rather than added,
because plain addition blew the dense check-mark stroke out to white and erased
its particle texture.

Cost is bounded three ways: the backing store is capped at 3.4 megapixels and
1.75x density, slow frames first reduce the particle count to a floor, and only
then is the glow dropped.

## D23 - form placement is fitted to the viewport

Placements are authored as viewport fractions for a 16:10 window. On narrower
desktop windows the stale-frame form ran under the fixed HUD and into the
headline. Each stop is now scaled by aspect ratio (never below 0.72) and its
centre is clamped so the form's known horizontal reach clears the HUD and the
edges; a form wider than the available space is centred. The foundation terrain
is intentionally wider than the screen and is exempt.

## D24 - the HTML shell is never heuristically cached

Nginx served `index.html` without a cache policy, so a browser could keep
showing the previous design for minutes after a redeploy. The shell now has
`expires -1` (`Cache-Control: no-cache`); hashed assets keep their own policy.
This is the only infrastructure change in the redesign and does not touch the
CSP or any other header.

## D25 - verification can resume at the live-stack stage

`clueso.ps1 -Action VerifyRuntime` runs only the live-stack assertions,
including the real database outage and recovery, against the running stack. It
exists because the host entered Modern Standby during two complete `Verify`
runs: the health wait expired during the suspend, and the second time the
interrupted `up` left the web container created but not started. Re-running the
whole pipeline rebuilds images and recreates containers, which repeats that
exposure; resuming at the stage that was interrupted does not. No host power
setting was changed to work around this.

Also in this round: the root format scripts name their directories instead of
`.`, because Prettier walked the ignored `.local` caches before applying its
ignore file and took more than ten minutes; and the Playwright test timeout is
60 seconds, still with zero retries, because the six-stop particle tour takes
about 21 seconds unloaded and exceeded 30 seconds when the shared host was at
94% CPU.
