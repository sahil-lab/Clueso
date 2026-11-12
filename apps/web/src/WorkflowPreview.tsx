import { useRef, useState, type KeyboardEvent } from "react";
import { Icon } from "./Icon";

const stages = [
  {
    name: "Capture",
    title: "START WITH\nTHE RIGHT STEP.",
    description:
      "The idea: capture meaningful actions, not fragile coordinates. A click with context. Recording will require explicit target authorization.",
    caption: "LESS GUESSWORK. MORE MEANING.",
  },
  {
    name: "Detect",
    title: "FIND THE CHANGE.\nKEEP THE STORY.",
    description:
      "Connect a UI change to the exact step it affects. This is a synthetic illustration, not an executed diff. The comparison engine is future work.",
    caption: "A SMALL CHANGE. NOT A BIG PRODUCTION.",
  },
  {
    name: "Review",
    title: "THE LAST WORD\nIS ALWAYS YOURS.",
    description:
      "Preview the updated moment before making it public. No recording or publishing happens here. Future publishing must require human approval.",
    caption: "HUMAN APPROVAL. NOT AN AFTERTHOUGHT.",
  },
];

function StoryboardScene({ stage }: { stage: number }) {
  return (
    <div className={`storyboard-scene scene-${stage}`} aria-hidden="true">
      <div className="scene-registration">
        <span>CLUESO LAB / SPECIMEN 0{stage + 1}</span>
        <Icon name="plus" />
      </div>
      {stage === 0 && (
        <div className="capture-scene">
          <div className="sample-window">
            <div className="sample-toolbar">
              <strong>
                atlas<span>*</span>
              </strong>
              <span>A PLACE FOR YOUR NEXT IDEA</span>
              <span className="sample-avatar">A</span>
            </div>
            <div className="sample-content">
              <span className="sample-eyebrow">WORKSPACE / PROJECTS</span>
              <div className="sample-title-row">
                <strong>
                  Make room
                  <br />
                  for something good.
                </strong>
                <span className="sample-create">
                  <Icon name="plus" /> New project
                </span>
              </div>
              <div className="sample-projects">
                <div className="sample-project">
                  <div className="project-art art-grid">
                    <i />
                    <i />
                    <i />
                    <span>*</span>
                  </div>
                  <strong>New perspectives</strong>
                  <span>A creative experiment</span>
                </div>
                <div className="sample-project">
                  <div className="project-art art-circles">
                    <i />
                    <i />
                    <i />
                  </div>
                  <strong>Good things ahead</strong>
                  <span>A little work in progress</span>
                </div>
              </div>
            </div>
          </div>
          <div className="capture-pointer">
            <Icon name="cursor" />
            <span>01 / CLICK &ldquo;NEW PROJECT&rdquo;</span>
          </div>
          <span className="sample-record">
            <span className="dot" /> SEMANTIC STEP / SAMPLE
          </span>
        </div>
      )}
      {stage === 1 && (
        <div className="detect-scene">
          <span className="diff-kicker">SAME INTENT. NEW INTERFACE.</span>
          <div className="diff-line diff-before">
            <span>BEFORE</span>
            <del>New project</del>
            <span>&minus;</span>
          </div>
          <div className="diff-line diff-after">
            <span>AFTER</span>
            <strong>Create project</strong>
            <Icon name="plus" />
          </div>
          <div className="impact-path">
            <span>UI CHANGE</span>
            <span className="impact-line" />
            <span className="impact-node">STEP 01</span>
            <span className="impact-line" />
            <span>SAME TUTORIAL</span>
          </div>
          <span className="diff-note">
            <Icon name="branch" /> CHANGE THE MOMENT, NOT EVERYTHING.
          </span>
        </div>
      )}
      {stage === 2 && (
        <div className="review-scene">
          <div className="review-frame">
            <span className="review-frame-label">UPDATED SEGMENT / CONCEPT</span>
            <strong>
              STILL YOUR
              <br />
              STORY.
            </strong>
            <span className="review-play">
              <Icon name="play" />
            </span>
            <div className="review-progress">
              <span />
            </div>
          </div>
          <div className="review-approval">
            <Icon name="shield" />
            <div>
              <strong>A human decision.</strong>
              <span>Preview first. Publish only with approval.</span>
            </div>
            <Icon name="lock" />
          </div>
          <span className="review-stamp">
            NOTHING
            <br />
            GOES LIVE
            <br />
            <strong>WITHOUT YOU.</strong>
          </span>
        </div>
      )}
      <div className="scene-registration scene-registration-bottom">
        <span>ILLUSTRATION ONLY</span>
        <span>0{stage + 1} &mdash; 03</span>
      </div>
    </div>
  );
}

export default function WorkflowPreview() {
  const [activeStage, setActiveStage] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const stage = stages[activeStage];
  if (!stage) throw new Error("Invalid workflow preview step.");

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
    setActiveStage(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <section id="preview" className="workflow-section" aria-labelledby="preview-title">
      <div className="section-index">
        <span>02 / A DIFFERENT KIND OF WORKFLOW</span>
        <span>INTERACTIVE CONCEPT</span>
      </div>
      <div className="workflow-heading">
        <h2 id="preview-title">
          SAME STORY.
          <br />
          <span>NEW CHAPTER.</span>
        </h2>
        <p>
          One idea. Three moments.
          <br />
          Step into the possibilities.
        </p>
      </div>
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
            onClick={() => setActiveStage(index)}
            onKeyDown={(event) => navigateTabs(event, index)}
          >
            <span className="tab-number">0{index + 1}</span>
            <span>{item.name}</span>
            <Icon name="arrow" />
          </button>
        ))}
      </div>
      <div
        id="workflow-panel"
        className="workflow-panel"
        role="tabpanel"
        aria-labelledby={`workflow-tab-${activeStage}`}
        tabIndex={0}
      >
        <div className="preview-caption" key={`caption-${activeStage}`}>
          <span className="preview-step">
            0{activeStage + 1}
            <span>/ 03</span>
          </span>
          <h3>{stage.title}</h3>
          <p>{stage.description}</p>
          <span className="stage-caption">
            <Icon name="arrow" />
            {stage.caption}
          </span>
        </div>
        <StoryboardScene stage={activeStage} />
      </div>
      <p className="preview-disclaimer">
        <Icon name="info" /> A SYNTHETIC PREVIEW, NOT A RECORDING ENGINE. NO RECORDING,
        COMPARISON, OR PUBLISHING RUNS.
      </p>
    </section>
  );
}
