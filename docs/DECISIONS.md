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
