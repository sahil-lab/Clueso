import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { Icon } from "./Icon";
import { onFrame, scrollToY } from "./motion";

const stages = [
  {
    name: "Capture",
    title: "Start with the right step.",
    description:
      "The idea: capture meaningful actions, not fragile coordinates. A click with context. Recording will require explicit target authorization.",
    note: "Less guesswork. More meaning.",
  },
  {
    name: "Detect",
    title: "Find the change. Keep the story.",
    description:
      "Connect a UI change to the exact step it affects. This is a synthetic illustration, not an executed diff. The comparison engine is future work.",
    note: "A small change. Not a big production.",
  },
  {
    name: "Review",
    title: "The last word is always yours.",
    description:
      "Preview the updated moment before making it public. No recording or publishing happens here. Future publishing must require human approval.",
    note: "Human approval. Not an afterthought.",
  },
];

function Specimen({ stage }: { stage: number }) {
  return (
    <div className="specimen" aria-hidden="true">
      {stage === 0 && (
        <>
          <span className="chip chip-a">
            <i className="chip-dot" /> Semantic step / sample
          </span>
          <span className="chip chip-b">
            <Icon name="cursor" /> Click &ldquo;New project&rdquo;
          </span>
        </>
      )}
      {stage === 1 && (
        <>
          <span className="chip chip-a chip-removed">&minus; New project</span>
          <span className="chip chip-b chip-added">+ Create project</span>
        </>
      )}
      {stage === 2 && (
        <>
          <span className="chip chip-a">
            <Icon name="eye" /> Updated segment / concept
          </span>
          <span className="chip chip-b chip-added">
            <Icon name="lock" /> Waiting for your approval
          </span>
        </>
      )}
    </div>
  );
}

export default function WorkflowPreview({ paused }: { paused: boolean }) {
  const [activeStage, setActiveStage] = useState(0);
  const section = useRef<HTMLElement>(null);
  const progressBar = useRef<HTMLSpanElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const derived = useRef(0);
  const pending = useRef<{ stage: number; frames: number } | null>(null);
  const stage = stages[activeStage];
  if (!stage) throw new Error("Invalid workflow preview step.");

  useEffect(() => {
    const element = section.current;
    if (!element) return;
    return onFrame(() => {
      const rect = element.getBoundingClientRect();
      const track = rect.height - window.innerHeight;
      if (track <= 0) return;
      const progress = Math.min(1, Math.max(0, -rect.top / track));
      progressBar.current?.style.setProperty("--progress", progress.toFixed(4));
      const next = Math.min(stages.length - 1, Math.floor(progress * stages.length));
      const wait = pending.current;
      if (wait) {
        wait.frames -= 1;
        if (next !== wait.stage && wait.frames > 0) return;
        pending.current = null;
      }
      if (next === derived.current) return;
      derived.current = next;
      setActiveStage(next);
    });
  }, []);

  function select(next: number, focus: boolean) {
    setActiveStage(next);
    const element = section.current;
    const track = element ? element.offsetHeight - window.innerHeight : 0;
    if (element && track > 0) {
      pending.current = { stage: next, frames: 150 };
      const start = element.getBoundingClientRect().top + window.scrollY;
      scrollToY(start + ((next + 0.5) / stages.length) * track, paused);
    }
    if (focus) tabRefs.current[next]?.focus({ preventScroll: true });
  }

  function navigateTabs(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number;
    switch (event.key) {
      case "ArrowRight":
        next = (index + 1) % stages.length;
        break;
      case "ArrowLeft":
        next = (index + stages.length - 1) % stages.length;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = stages.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    select(next, true);
  }

  return (
    <section
      id="preview"
      className="workflow"
      ref={section}
      aria-labelledby="preview-title"
      tabIndex={-1}
    >
      {stages.map((item, index) => (
        <span
          key={item.name}
          className="form-marker"
          data-form={index + 2}
          data-form-wide="0.72 0.6 0.24"
          data-form-narrow="0.5 0.36 0.15"
          style={{ "--k": index } as CSSProperties}
          aria-hidden="true"
        />
      ))}
      <div className="workflow-stage">
        <header className="workflow-head">
          <p className="label">02 &mdash; A different kind of workflow</p>
          <h2 id="preview-title">
            Same story. <em>New chapter.</em>
          </h2>
        </header>
        <div
          className="workflow-tabs"
          role="tablist"
          aria-label="Tutorial workflow preview"
        >
          {stages.map((item, index) => (
            <button
              key={item.name}
              id={`workflow-tab-${index}`}
              role="tab"
              aria-selected={activeStage === index}
              aria-controls="workflow-panel"
              tabIndex={activeStage === index ? 0 : -1}
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              onClick={() => select(index, false)}
              onKeyDown={(event) => navigateTabs(event, index)}
            >
              <span className="tab-number">0{index + 1}</span>
              {item.name}
            </button>
          ))}
          <span className="workflow-progress" ref={progressBar} aria-hidden="true" />
        </div>
        <div
          id="workflow-panel"
          className="workflow-panel"
          role="tabpanel"
          aria-labelledby={`workflow-tab-${activeStage}`}
          tabIndex={0}
        >
          <div className="preview-caption" key={activeStage}>
            <span className="preview-step">
              0{activeStage + 1}
              <i>/ 03</i>
            </span>
            <h3>{stage.title}</h3>
            <p>{stage.description}</p>
            <span className="stage-note">
              <Icon name="arrow" />
              {stage.note}
            </span>
          </div>
          <Specimen stage={activeStage} />
        </div>
        <p className="preview-disclaimer">
          <Icon name="info" /> A synthetic preview, not a recording engine. No recording,
          comparison, or publishing runs.
        </p>
      </div>
    </section>
  );
}
