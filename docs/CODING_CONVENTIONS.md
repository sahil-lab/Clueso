# Coding conventions

- Keep application code within this monorepo and respect phase ownership.
- Java: Java 21, Spring constructor injection, records for DTOs, Jakarta Bean
  Validation, Flyway SQL migrations, Spotless with Google Java Format.
- TypeScript: strict mode, no unchecked `any` or double casts, typed API boundary,
  React text rendering, ESLint and Prettier. Treat network JSON as `unknown`.
- Use LF line endings and UTF-8. This avoids Windows-mounted shell/interpreter
  failures without modifying host tools.
- Keep configuration in environment variables or local secret files, never
  passwords or personal data in source, fixtures, logs, or evidence.
- Validate the contract at the server, not only in the browser. Reject unknown
  input fields and report errors through problem details.
- Use narrow, intentional error handling. Never return a success-shaped value
  after a database, network, parsing, or validation failure.
- Do not log request bodies or echo rejected values. Log safe event names and
  trace context; hide stack traces from HTTP responses.
- Keep migrations immutable; use forward changes. Never silently reset a schema.
- Run the smallest relevant tests while editing and the complete Phase 1
  verification before claiming the phase verified.
- Use synthetic data only. Keep tests deterministic and bounded; one browser
  worker, finite request/test timeouts, no production or cloud endpoints.
- Comments should explain non-obvious choices only.
- Keep implementation status separate from observed test results. Record exact
  commands, counts, failures, fixes, remaining risks, and next phase.
