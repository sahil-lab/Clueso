import { useState, type FormEvent } from "react";
import { checkSystem, type SystemCheckResponse } from "./api";
import { Icon } from "./Icon";

type CheckState =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "ready"; result: SystemCheckResponse; checkedAt: string }
  | { kind: "error"; message: string };

export default function LiveLab() {
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
      setState({
        kind: "ready",
        result,
        checkedAt: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      });
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
    <section id="diagnostic" className="lab-section" aria-labelledby="lab-title">
      <div className="section-index">
        <span>03 / THE WORKING PART</span>
        <span>
          <span className="dot" /> LOCAL BY DESIGN
        </span>
      </div>
      <div className="lab-layout">
        <div className="lab-copy">
          <h2 id="lab-title">
            REAL CHECK.
            <br />
            <span>NO MAGIC.</span>
          </h2>
          <p className="lab-description">
            Good ideas need a working foundation. Take this one for a spin.
          </p>
          <p className="lab-explanation">
            Send a synthetic label from your browser, through the API, to a real migrated
            database. No mock response. Nothing saved.
          </p>
          <div className="runtime-list" aria-label="Runtime components">
            <div className="runtime-row">
              <Icon name="monitor" />
              <div className="runtime-copy">
                <h3>THE SURFACE</h3>
                <p>React + TypeScript</p>
              </div>
              <span className="runtime-status status-ready">
                <span className="dot" /> This page
              </span>
            </div>
            <div className="runtime-row">
              <Icon name="code" />
              <div className="runtime-copy">
                <h3>THE CONNECTION</h3>
                <p>Java 21 + Spring Boot 3</p>
              </div>
              <span className={`runtime-status${ready ? " status-ready" : ""}`}>
                <span className="dot" />
                {ready ? "Verified" : "Not checked"}
              </span>
            </div>
            <div className="runtime-row">
              <Icon name="database" />
              <div className="runtime-copy">
                <h3>THE MEMORY</h3>
                <p>PostgreSQL 17 + Flyway</p>
              </div>
              <span className={`runtime-status${ready ? " status-ready" : ""}`}>
                <span className="dot" />
                {ready ? "Verified" : "Not checked"}
              </span>
            </div>
          </div>
          <div className="lab-safety">
            <Icon name="shield" />
            <span>
              SYNTHETIC INPUT ONLY.
              <br />
              YOUR ACTUAL DATA STAYS OUT OF THE STORY.
            </span>
          </div>
        </div>
        <div className="lab-console">
          <div className="console-top">
            <span>
              <span className="dot" /> CLUESO / LOCAL
            </span>
            <span>READ-ONLY CHECK</span>
            <Icon name="terminal" />
          </div>
          <form onSubmit={(event) => void submit(event)}>
            <div className="field-label">
              <label htmlFor="check-label">Synthetic check label</label>
              <span>{label.length} / 64</span>
            </div>
            <div className="console-input">
              <span aria-hidden="true">&gt;</span>
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
            </div>
            <p id="label-help" className="field-help">
              Just a sample label. Never personal data.
            </p>
            <button type="submit" className="run-button" disabled={pending}>
              <span>{pending ? "Checking..." : "Run check"}</span>
              {pending ? (
                <span className="spinner" aria-hidden="true" />
              ) : (
                <Icon name="arrow" />
              )}
            </button>
          </form>
          <div
            className={`check-output output-${state.kind}`}
            aria-live="polite"
            aria-atomic="true"
            aria-busy={pending}
          >
            {state.kind === "idle" && (
              <div className="idle-output">
                <span className="console-brackets" aria-hidden="true">
                  [&nbsp;_&nbsp;]
                </span>
                <strong>Waiting for your signal.</strong>
                <p>A real response, one click away.</p>
              </div>
            )}
            {pending && (
              <div className="pending-output">
                <span className="spinner" aria-hidden="true" />
                <strong>Following the connection...</strong>
                <p>Browser &rarr; API &rarr; database</p>
              </div>
            )}
            {state.kind === "error" && (
              <div className="error-output" role="alert">
                <Icon name="info" />
                <div>
                  <strong>Check could not complete</strong>
                  <p>{state.message}</p>
                  <span>Nothing was saved. You can try again.</span>
                </div>
              </div>
            )}
            {state.kind === "ready" && (
              <div className="success-output">
                <div className="result-heading">
                  <Icon name="check" />
                  <div>
                    <strong>Round trip complete</strong>
                    <span>Checked at {state.checkedAt}</span>
                  </div>
                  <span className="response-code">200 OK</span>
                </div>
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
              </div>
            )}
          </div>
          {state.kind === "ready" && (
            <div className="result-actions">
              <details className="response-details">
                <summary>
                  View response JSON <Icon name="down" />
                </summary>
                <pre>{JSON.stringify(state.result, null, 2)}</pre>
              </details>
              <button
                className="text-button"
                type="button"
                onClick={() => setState({ kind: "idle" })}
              >
                Clear result
              </button>
            </div>
          )}
          <div className="diagnostic-footer">
            <span>POST</span>
            <code>/api/v1/system/check</code>
            <Icon name="lock" />
          </div>
          <p className="privacy-caption">NO LABEL STORED. NO EXTERNAL CALLS.</p>
        </div>
      </div>
    </section>
  );
}
