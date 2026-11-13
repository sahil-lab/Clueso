# Source file inventory

All paths are within Clueso. The initial directory contained only the engineering
PDF, which remains unchanged. These are **68 source/documentation additions**,
relative to the initial PDF-only directory, not a commit comparison. Git metadata
was created outside this UI task and has not been changed by this session.

The immersive redesign removes the SVG motion artwork and adds the particle
field (engine, shaders, shape samplers, placement helpers and their tests), a
shared frame ticker with smooth scrolling, and the preloader/cursor/marquee
effects. It rewrites the page composition, workflow preview, live lab,
stylesheet, and browser tests. The web manifest and lockfile add `lenis` and
`@fontsource/instrument-serif` and drop `@fontsource/anton`.

Outside the web app, four files changed: `nginx.conf` (no-cache HTML shell),
the root `package.json` (format scripts name their directories),
`playwright.config.ts` (60-second test timeout, still no retries), and
`scripts/clueso.ps1` (a `VerifyRuntime` action). The backend, API
client/contracts, Compose file, and CSP are unchanged.

## Root and conventions

- [README.md](../README.md)
- [.gitignore](../.gitignore)
- [.dockerignore](../.dockerignore)
- [.gitattributes](../.gitattributes)
- [.editorconfig](../.editorconfig)
- [.prettierignore](../.prettierignore)
- [.prettierrc.json](../.prettierrc.json)
- [package.json](../package.json)
- [package-lock.json](../package-lock.json) - generated and verified with npm ci
- [eslint.config.mjs](../eslint.config.mjs)
- [tsconfig.tools.json](../tsconfig.tools.json)
- [playwright.config.ts](../playwright.config.ts)
- [.github/workflows/ci.yml](../.github/workflows/ci.yml) - authored, not run remotely

## Requirements, safety, architecture and evidence

- [PRD.md](PRD.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [THREAT_MODEL.md](THREAT_MODEL.md)
- [PLAN.md](PLAN.md)
- [DECISIONS.md](DECISIONS.md)
- [CODING_CONVENTIONS.md](CODING_CONVENTIONS.md)
- [STATUS.md](STATUS.md)
- [VERIFICATION.md](VERIFICATION.md)
- [CHANGED_FILES.md](CHANGED_FILES.md)

## Frontend

- [apps/web/package.json](../apps/web/package.json)
- [apps/web/tsconfig.json](../apps/web/tsconfig.json) - generated with tsc, then scoped
- [apps/web/vite.config.ts](../apps/web/vite.config.ts)
- [apps/web/index.html](../apps/web/index.html)
- [apps/web/Dockerfile](../apps/web/Dockerfile)
- [apps/web/Dockerfile.dockerignore](../apps/web/Dockerfile.dockerignore)
- [apps/web/src/main.tsx](../apps/web/src/main.tsx)
- [apps/web/src/App.tsx](../apps/web/src/App.tsx)
- [apps/web/src/Icon.tsx](../apps/web/src/Icon.tsx)
- [apps/web/src/ParticleField.tsx](../apps/web/src/ParticleField.tsx) - canvas host, HUD, static fallback
- [apps/web/src/effects.tsx](../apps/web/src/effects.tsx) - preloader, cursor, grain, marquee, magnetic hook
- [apps/web/src/motion.ts](../apps/web/src/motion.ts) - shared frame ticker and smooth scrolling
- [apps/web/src/field/engine.ts](../apps/web/src/field/engine.ts) - WebGL2 field, glow passes, adaptive quality
- [apps/web/src/field/shaders.ts](../apps/web/src/field/shaders.ts)
- [apps/web/src/field/shapes.ts](../apps/web/src/field/shapes.ts) - deterministic samplers for the six forms
- [apps/web/src/field/layout.ts](../apps/web/src/field/layout.ts) - placement fitting and backing-store cap
- [apps/web/src/field/shapes.test.ts](../apps/web/src/field/shapes.test.ts)
- [apps/web/src/field/layout.test.ts](../apps/web/src/field/layout.test.ts)
- [apps/web/src/LiveLab.tsx](../apps/web/src/LiveLab.tsx)
- [apps/web/src/WorkflowPreview.tsx](../apps/web/src/WorkflowPreview.tsx)
- [apps/web/src/api.ts](../apps/web/src/api.ts)
- [apps/web/src/styles.css](../apps/web/src/styles.css)
- [apps/web/src/App.test.tsx](../apps/web/src/App.test.tsx)
- [apps/web/src/api.test.ts](../apps/web/src/api.test.ts)

## API

- [services/api/pom.xml](../services/api/pom.xml)
- [services/api/Dockerfile](../services/api/Dockerfile)
- [services/api/.dockerignore](../services/api/.dockerignore)
- [CluesoApplication.java](../services/api/src/main/java/dev/clueso/api/CluesoApplication.java)
- [ApiExceptionHandler.java](../services/api/src/main/java/dev/clueso/api/http/ApiExceptionHandler.java)
- [JsonConfiguration.java](../services/api/src/main/java/dev/clueso/api/http/JsonConfiguration.java)
- [SystemController.java](../services/api/src/main/java/dev/clueso/api/system/SystemController.java)
- [SystemCheckRequest.java](../services/api/src/main/java/dev/clueso/api/system/SystemCheckRequest.java)
- [SystemCheckResponse.java](../services/api/src/main/java/dev/clueso/api/system/SystemCheckResponse.java)
- [PlatformMetadataRepository.java](../services/api/src/main/java/dev/clueso/api/system/PlatformMetadataRepository.java)
- [SchemaHealthIndicator.java](../services/api/src/main/java/dev/clueso/api/system/SchemaHealthIndicator.java)
- [application.properties](../services/api/src/main/resources/application.properties)
- [V1__platform_metadata.sql](../services/api/src/main/resources/db/migration/V1__platform_metadata.sql)
- [SystemControllerTest.java](../services/api/src/test/java/dev/clueso/api/system/SystemControllerTest.java)
- [ApiIntegrationTest.java](../services/api/src/test/java/dev/clueso/api/system/ApiIntegrationTest.java)

## Infrastructure, contract and end-to-end validation

- [infra/docker/compose.yaml](../infra/docker/compose.yaml)
- [infra/docker/nginx.conf](../infra/docker/nginx.conf)
- [infra/docker/nginx-main.conf](../infra/docker/nginx-main.conf)
- [packages/contracts/openapi.yaml](../packages/contracts/openapi.yaml)
- [scripts/clueso.ps1](../scripts/clueso.ps1)
- [scripts/verify-runtime.ps1](../scripts/verify-runtime.ps1)
- [tests/e2e/smoke.spec.ts](../tests/e2e/smoke.spec.ts)

## Generated local state (not source)

- `.local/evidence/`: command logs, results, screenshots and source digests.
- `.local/backup/editorial-v2/`: the superseded editorial sources, kept locally.
- `.local/secrets/`: generated database secret; never printed or checked in.
- `.local/m2/`, `.local/npm-cache/`: generated dependency caches.
- `apps/web/dist/`, `services/api/target/`: compiled output.
- `clueso_node_modules`, `clueso_postgres_data`, `clueso_test_postgres_data`:
  Docker-managed generated dependencies/data.
- An ignored, inactive host `node_modules/` tree remains from the interrupted
  bind-mount install; it is not used by active tooling.

No worker, benchmark implementation, Git repository, cloud infrastructure,
recording data, or out-of-project authored file was created.
