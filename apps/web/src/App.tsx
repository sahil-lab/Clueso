import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import LiveLab from "./LiveLab";
import MotionArtwork from "./MotionArtwork";
import WorkflowPreview from "./WorkflowPreview";

const navigation = [
  { id: "idea", label: "The idea" },
  { id: "preview", label: "Workflow preview" },
  { id: "diagnostic", label: "The live lab" },
];

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [manualPause, setManualPause] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const menuButton = useRef<HTMLButtonElement>(null);
  const paused = manualPause || reducedMotion;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return (
    <div className="experience" data-motion={paused ? "paused" : "running"}>
      <a className="skip-link" href="#main">
        Skip to workspace
      </a>
      <header
        className={`site-header${menuOpen ? " menu-open" : ""}`}
        onKeyDown={(event) => {
          if (event.key === "Escape" && menuOpen) {
            setMenuOpen(false);
            menuButton.current?.focus();
          }
        }}
      >
        <a
          className="wordmark"
          href="#overview"
          aria-label="Clueso Lab overview"
          onClick={() => setMenuOpen(false)}
        >
          clueso<span className="wordmark-star">*</span>
          <span className="wordmark-lab">
            INDEPENDENT
            <br />
            LAB
          </span>
        </a>
        <nav id="site-navigation" aria-label="Workspace navigation">
          {navigation.map((item, index) => (
            <a
              className="nav-link"
              key={item.id}
              href={`#${item.id}`}
              onClick={() => setMenuOpen(false)}
            >
              <span>0{index + 1}</span>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="header-tools">
          <button
            className="motion-control"
            type="button"
            aria-label={
              reducedMotion
                ? "Motion reduced by system preference"
                : paused
                  ? "Resume motion"
                  : "Pause motion"
            }
            aria-pressed={paused}
            disabled={reducedMotion}
            onClick={() => setManualPause(!manualPause)}
          >
            <Icon name={paused ? "play" : "pause"} />
            <span>
              {reducedMotion ? "Motion reduced" : paused ? "Motion off" : "Motion on"}
            </span>
          </button>
          <a className="header-lab" href="#diagnostic">
            ENTER THE LAB <Icon name="arrow" />
          </a>
          <button
            className="menu-toggle"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
            aria-controls="site-navigation"
            onClick={() => setMenuOpen(!menuOpen)}
            ref={menuButton}
          >
            <Icon name={menuOpen ? "close" : "menu"} />
          </button>
        </div>
      </header>

      <main id="main">
        <section id="overview" className="cover" aria-labelledby="cover-title">
          <div className="cover-index">
            <span>
              <span className="tiny-square" /> AN EXPERIMENT IN CLARITY
            </span>
            <span>PRODUCT STORIES, REIMAGINED &mdash; VOL. 01</span>
          </div>
          <div className="cover-composition">
            <div className="cover-type">
              <h1 id="cover-title" aria-label="Show it. Keep it moving.">
                <span>SHOW IT.</span>
                <span>KEEP IT</span>
                <span className="outlined-word">
                  MOVING<span className="solid-period">.</span>
                </span>
              </h1>
              <div className="cover-description">
                <span className="annotation-arrow" aria-hidden="true">
                  <Icon name="arrow" />
                </span>
                <p>
                  Your product never stands still.
                  <br />
                  Why should its tutorials?
                </p>
              </div>
              <a className="explore-link" href="#preview">
                <span>MEET THE LIVING TUTORIAL</span>
                <span className="round-arrow">
                  <Icon name="arrow" />
                </span>
              </a>
            </div>
            <MotionArtwork paused={paused} />
          </div>
          <div className="cover-bottom">
            <span>
              THE CONCEPT IS AMBITIOUS.
              <br />
              <strong>THE FOUNDATION IS REAL.</strong>
            </span>
            <p>
              An independent exploration of tutorials that evolve with your product. A
              synthetic preview, built on a working local stack.
            </p>
            <a href="#idea" aria-label="Scroll to the idea">
              <span>
                SCROLL TO
                <br />
                GET THE IDEA
              </span>
              <Icon name="arrow" />
            </a>
          </div>
        </section>

        <div className="ticker" aria-hidden="true">
          <div className="ticker-track">
            {[0, 1].map((copy) => (
              <div className="ticker-group" key={copy}>
                <span>LESS RE-RECORDING</span>
                <span className="ticker-star">*</span>
                <span>MORE STORYTELLING</span>
                <span className="ticker-star">*</span>
                <span>ALWAYS A WORK IN MOTION</span>
                <span className="ticker-star">*</span>
              </div>
            ))}
          </div>
        </div>

        <section id="idea" className="idea-section" aria-labelledby="idea-title">
          <div className="section-index">
            <span>01 / THE PROBLEM WITH STANDING STILL</span>
            <Icon name="plus" />
          </div>
          <div className="idea-layout">
            <h2 id="idea-title">
              YOUR UI
              <br />
              MOVED ON.
              <br />
              <span>
                YOUR VIDEO
                <br />
                DIDN&apos;T.
              </span>
            </h2>
            <div className="idea-copy">
              <span className="idea-asterisk" aria-hidden="true">
                *
              </span>
              <p>
                A button moves. A flow changes.
                <br />
                Yesterday&apos;s perfect walkthrough
                <br />
                becomes today&apos;s outdated advice.
              </p>
              <p className="idea-description">
                What if you could update just the part that changed? Keep the useful
                story. Leave the endless retakes behind.
              </p>
              <div
                className="before-after"
                aria-label="Synthetic example of a changed button label"
              >
                <div>
                  <span>THEN</span>
                  <span className="old-button">New project</span>
                </div>
                <Icon name="arrow" />
                <div>
                  <span>NOW</span>
                  <span className="new-button">
                    <Icon name="plus" /> Create project
                  </span>
                </div>
              </div>
              <span className="example-note">
                ONE SYNTHETIC CHANGE. A DIFFERENT WAY TO THINK.
              </span>
            </div>
          </div>
          <div className="idea-footnote">
            <span>
              CHANGE THE STEP.
              <br />
              NOT THE WHOLE STORY.
            </span>
            <span className="idea-footnote-arrow" aria-hidden="true">
              <Icon name="arrow" />
            </span>
          </div>
        </section>

        <WorkflowPreview />
        <LiveLab />

        <section
          id="roadmap"
          className="boundaries-section"
          aria-labelledby="boundaries-title"
        >
          <div className="boundaries-heading">
            <span className="section-kicker">A NOTE ON WHAT&apos;S REAL</span>
            <h2 id="boundaries-title">
              BIG VISION.
              <br />
              CLEAR BOUNDARIES.
            </h2>
          </div>
          <div className="boundaries-questions">
            <details className="roadmap-current" open>
              <summary>
                What can I actually try?
                <Icon name="plus" />
              </summary>
              <p>
                The live check connects this interface to a Java API and a migrated
                PostgreSQL database. The interactive storyboard is a synthetic
                illustration, not a recording engine.
              </p>
            </details>
            <details>
              <summary>
                What&apos;s the next chapter?
                <Icon name="plus" />
              </summary>
              <p>
                Phase 2: domain data, permissions, and safe state changes. Recording,
                change detection, and selective updates belong to later phases and are not
                implemented.
              </p>
            </details>
            <details>
              <summary>
                Who stays in control?
                <Icon name="plus" />
              </summary>
              <p>
                You do. Future recording requires target authorization. Sensitive content
                must be masked, and publishing must require human approval. No real
                content is captured here.
              </p>
            </details>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-top">
          <span>
            KEEP YOUR PRODUCT MOVING.
            <br />
            TAKE THE STORY WITH IT.
          </span>
          <a href="#overview">
            BACK TO THE TOP <Icon name="arrow" />
          </a>
        </div>
        <div className="footer-wordmark" aria-hidden="true">
          clueso<span>*</span>
        </div>
        <div className="footer-bottom">
          <span>ORIGINAL CONCEPT / LOCAL PROTOTYPE</span>
          <span>NOT AFFILIATED WITH CLUESO.</span>
          <span>NO RECORDING. NO PUBLISHING.</span>
        </div>
      </footer>
    </div>
  );
}
