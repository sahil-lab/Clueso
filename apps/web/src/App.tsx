import { useState, type FormEvent } from "react";
import { checkSystem, type SystemCheckResponse } from "./api";

type CheckState =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "ready"; result: SystemCheckResponse }
  | { kind: "error"; message: string };

function Mark({ small = false }: { small?: boolean }) {
  return (
    <span className={`brand-mark${small ? " brand-mark-small" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 32 32" fill="none">
        <path d="M22 7H13a9 9 0 0 0 0 18h9" stroke="currentColor" strokeWidth="4" />
        <path d="m17 11 8 5-8 5z" fill="currentColor" />
      </svg>
    </span>
  );
}

export default function App() {
  const [label, setLabel] = useState("synthetic-smoke");
  const [state, setState] = useState<CheckState>({ kind: "idle" });
  const pending = state.kind === "pending";
  const ready = state.kind === "ready";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!label.trim()) {
      setState({ kind: "error", message: "Enter a nonblank synthetic label." });
      return;
    }
    setState({ kind: "pending" });
    try {
      const result = await checkSystem(label);
      setState({ kind: "ready", result });
    } catch (error) {
      console.error(
        "system_check_failed",
        error instanceof Error ? error.name : "unknown_error",
      );
      setState({
        kind: "error",
        message:
          error instanceof Error ? error.message : "Unexpected check failure. Try again.",
      });
    }
  }

  return (
    <div className="workspace">
      <a className="skip-link" href="#main">
        Skip to workspace
      </a>
      <aside className="sidebar" aria-label="Workspace navigation">
        <a className="brand" href="#overview" aria-label="Clueso Lab overview">
          <Mark />
          <span>
            clueso<span className="brand-lab">LAB</span>
          </span>
        </a>
        <div className="workspace-picker">
          <span className="workspace-avatar">L</span>
          <div>
            <strong>Local workspace</strong>
            <span>Independent prototype</span>
          </div>
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav>
          <a className="nav-link nav-current" href="#overview">
            <span aria-hidden="true">01</span> Overview
          </a>
          <a className="nav-link" href="#diagnostic">
            <span aria-hidden="true">02</span> System check
          </a>
          <a className="nav-link" href="#roadmap">
            <span aria-hidden="true">03</span> Build roadmap
          </a>
        </nav>
        <div className="sidebar-note">
          <span className="tiny-label">A SAFE PLACE TO START</span>
          <p>Synthetic data. Local services. No recording or publishing.</p>
          <span className="local-indicator">
            <span className="dot" /> Local-only environment
          </span>
        </div>
        <div className="sidebar-footer">
          Original prototype &middot; Not affiliated with Clueso
        </div>
      </aside>

      <div className="content">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> <strong>Overview</strong>
          </div>
          <span className="environment-badge">
            <span className="dot" />
            DEVELOPMENT
          </span>
        </header>

        <main id="main">
          <section id="overview" className="intro">
            <div>
              <p className="eyebrow">SELF-UPDATING PRODUCT TUTORIALS</p>
              <h1>Start with a solid foundation.</h1>
              <p className="intro-description">
                A local workspace for the tutorial updater. Validate the stack today;
                build the recording engine next.
              </p>
            </div>
            <span className="phase-pill">Phase 1 / Working skeleton</span>
          </section>

          <section className="foundation-banner" aria-labelledby="foundation-title">
            <div className="banner-copy">
              <span className="banner-kicker">THE FIRST VERTICAL SLICE</span>
              <h2 id="foundation-title">One request. The whole stack.</h2>
              <p>
                Follow a synthetic check from this dashboard through the API to a real,
                migrated database. Nothing is recorded or stored.
              </p>
              <a href="#diagnostic" className="banner-link">
                Run your first check <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
            <div className="stack-flow" aria-label="Web to API to database">
              <div>
                <span className="flow-icon">&lt;/&gt;</span>
                <strong>Web</strong>
                <span>React</span>
              </div>
              <span className="flow-line" aria-hidden="true" />
              <div>
                <span className="flow-icon">{"{ }"}</span>
                <strong>API</strong>
                <span>Spring Boot</span>
              </div>
              <span className="flow-line" aria-hidden="true" />
              <div>
                <span className="flow-icon">DB</span>
                <strong>Database</strong>
                <span>PostgreSQL</span>
              </div>
            </div>
          </section>

          <section id="runtime" className="runtime-grid" aria-label="Runtime components">
            <article className="runtime-card">
              <div className="card-heading">
                <span className="component-icon violet">&lt;/&gt;</span>
                <span className="small-status">This page</span>
              </div>
              <h2>Web dashboard</h2>
              <p>React + TypeScript</p>
              <div className="runtime-detail">
                <span className="dot success-dot" /> Served locally &middot; :18109
              </div>
            </article>
            <article className="runtime-card">
              <div className="card-heading">
                <span className="component-icon blue">{"{ }"}</span>
                <span className={`small-status${ready ? " verified" : ""}`}>
                  {ready ? "Verified" : "Not checked"}
                </span>
              </div>
              <h2>Orchestration API</h2>
              <p>Java 21 + Spring Boot 3</p>
              <div className="runtime-detail">
                <span className={`dot${ready ? " success-dot" : ""}`} />
                {ready ? "Round trip verified" : "Awaiting a system check"}
              </div>
            </article>
            <article className="runtime-card">
              <div className="card-heading">
                <span className="component-icon amber">DB</span>
                <span className={`small-status${ready ? " verified" : ""}`}>
                  {ready ? "Verified" : "Not checked"}
                </span>
              </div>
              <h2>Persistent state</h2>
              <p>PostgreSQL 17 + Flyway</p>
              <div className="runtime-detail">
                <span className={`dot${ready ? " success-dot" : ""}`} />
                {ready
                  ? `Schema v${state.result.schemaVersion} confirmed`
                  : "Private network"}
              </div>
            </article>
          </section>

          <div className="details-grid">
            <section id="diagnostic" className="panel" aria-labelledby="diagnostic-title">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">TRY THE FOUNDATION</p>
                  <h2 id="diagnostic-title">System check</h2>
                </div>
                <span className="read-only-tag">READ-ONLY</span>
              </div>
              <p className="section-description">
                Send a label, validate the request, and read the migrated schema version.
              </p>
              <form onSubmit={(event) => void submit(event)}>
                <label htmlFor="check-label">Synthetic check label</label>
                <p id="label-help" className="field-help">
                  Up to 64 characters. Use a sample label, never personal data.
                </p>
                <div className="form-row">
                  <input
                    id="check-label"
                    name="label"
                    value={label}
                    onChange={(event) => setLabel(event.target.value)}
                    aria-describedby="label-help"
                    required
                    maxLength={64}
                    pattern="[A-Za-z0-9._ \-]+"
                    autoComplete="off"
                    spellCheck={false}
                    disabled={pending}
                  />
                  <button type="submit" disabled={pending}>
                    {pending ? "Checking..." : "Run check"}
                    {!pending && <span aria-hidden="true">&rarr;</span>}
                  </button>
                </div>
              </form>
              <div className="check-output" aria-live="polite" aria-atomic="true">
                {state.kind === "idle" && (
                  <div className="idle-output">
                    <span className="output-symbol" aria-hidden="true">
                      &gt;_
                    </span>
                    <div>
                      <strong>Ready when you are</strong>
                      <p>Your verified response will appear here.</p>
                    </div>
                  </div>
                )}
                {pending && (
                  <p className="pending-output">Checking API and database...</p>
                )}
                {state.kind === "error" && (
                  <div className="error-output" role="alert">
                    <strong>Check could not complete</strong>
                    <p>{state.message}</p>
                  </div>
                )}
                {state.kind === "ready" && (
                  <div className="success-output">
                    <strong>
                      <span className="dot success-dot" /> Round trip complete
                    </strong>
                    <dl>
                      <div>
                        <dt>Service</dt>
                        <dd>{state.result.service}</dd>
                      </div>
                      <div>
                        <dt>Label</dt>
                        <dd>{state.result.label}</dd>
                      </div>
                      <div>
                        <dt>Database schema</dt>
                        <dd>Version {state.result.schemaVersion}</dd>
                      </div>
                    </dl>
                    <p>Validated by the API. Read from PostgreSQL. No label persisted.</p>
                  </div>
                )}
              </div>
              <div className="endpoint">
                <span>POST</span>
                <code>/api/v1/system/check</code>
              </div>
            </section>

            <section
              id="roadmap"
              className="panel roadmap"
              aria-labelledby="roadmap-title"
            >
              <p className="eyebrow">BUILD WITH INTENTION</p>
              <h2 id="roadmap-title">Foundation first. Engine next.</h2>
              <ol className="phase-list">
                <li>
                  <span className="phase-number completed">0</span>
                  <div>
                    <h3>Contract &amp; safety</h3>
                    <p>Requirements, architecture, and local-only boundaries.</p>
                  </div>
                </li>
                <li className="current-phase">
                  <span className="phase-number current">1</span>
                  <div>
                    <h3>Working skeleton</h3>
                    <p>Web, API, migrations, and a real end-to-end check.</p>
                    <span className="current-label">YOU ARE HERE</span>
                  </div>
                </li>
                <li>
                  <span className="phase-number">2</span>
                  <div>
                    <h3>Core data &amp; permissions</h3>
                    <p>Next phase. Domain contracts and authorized state changes.</p>
                  </div>
                </li>
                <li>
                  <span className="phase-number">3+</span>
                  <div>
                    <h3>Recording &amp; selective updates</h3>
                    <p>Future work. Not available in this prototype.</p>
                  </div>
                </li>
              </ol>
              <p className="roadmap-note">
                Recording requires authorization. Publishing will require human approval.
              </p>
            </section>
          </div>

          <footer className="page-footer">
            <span>
              <Mark small /> Clueso-inspired engineering lab
            </span>
            <span>
              Local prototype &middot; Synthetic data only &middot; No cloud services
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}
