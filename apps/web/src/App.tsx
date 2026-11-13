import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";
import { Cursor, Grain, Marquee, Preloader, useMagnetic } from "./effects";
import { Icon } from "./Icon";
import LiveLab from "./LiveLab";
import { onFrame, scrollToY, setSmoothScroll } from "./motion";
import ParticleField from "./ParticleField";
import WorkflowPreview from "./WorkflowPreview";

const navigation = [
  { id: "idea", label: "The idea" },
  { id: "preview", label: "Workflow preview" },
  { id: "diagnostic", label: "The live lab" },
];

const chapters = ["overview", "idea", "preview", "diagnostic", "roadmap"];

const statement =
  "A button moves. A flow changes. And yesterday's perfect walkthrough quietly becomes today's wrong answer.".split(
    " ",
  );

function Idea({ paused }: { paused: boolean }) {
  const section = useRef<HTMLElement>(null);
  const pin = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = section.current;
    const target = pin.current;
    if (!element || !target) return;
    if (paused) {
      target.style.setProperty("--p", "1");
      return;
    }
    return onFrame(() => {
      const rect = element.getBoundingClientRect();
      const track = rect.height - window.innerHeight;
      if (track <= 0) return;
      const progress = Math.min(1, Math.max(0, -rect.top / track));
      target.style.setProperty("--p", progress.toFixed(4));
    });
  }, [paused]);

  return (
    <section
      id="idea"
      className="idea"
      ref={section}
      aria-labelledby="idea-title"
      data-form="1"
      data-form-wide="0.8 0.47 0.2"
      data-form-narrow="0.5 0.23 0.14"
      tabIndex={-1}
    >
      <div className="idea-pin" ref={pin}>
        <p className="label">01 &mdash; The problem with standing still</p>
        <h2
          id="idea-title"
          className="statement"
          style={{ "--n": statement.length } as CSSProperties}
        >
          {statement.map((word, index) => (
            <span className="word" key={index} style={{ "--i": index } as CSSProperties}>
              {word}{" "}
            </span>
          ))}
        </h2>
        <div className="idea-aside">
          <p>
            What if you only re-made <em>the moment that changed?</em>
          </p>
          <div
            className="before-after"
            aria-label="Synthetic example of a changed button label"
          >
            <span className="old-button">New project</span>
            <Icon name="arrow" />
            <span className="new-button">Create project</span>
            <span className="example-note">One synthetic change</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [manualPause, setManualPause] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [intro] = useState(!reducedMotion);
  const [ready, setReady] = useState(reducedMotion);
  const [chapter, setChapter] = useState("overview");
  const root = useRef<HTMLDivElement>(null);
  const header = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const paused = manualPause || reducedMotion;
  const reveal = useCallback(() => setReady(true), []);
  const labLink = useMagnetic<HTMLAnchorElement>(paused);
  const beginLink = useMagnetic<HTMLAnchorElement>(paused);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const enabled = !paused && window.matchMedia("(pointer: fine)").matches;
    setSmoothScroll(enabled);
    const stop = enabled ? onFrame(() => undefined) : undefined;
    return () => {
      stop?.();
      setSmoothScroll(false);
    };
  }, [paused]);

  useEffect(() => {
    const targets = Array.from(
      root.current?.querySelectorAll<HTMLElement>("[data-reveal]") ?? [],
    );
    if (typeof IntersectionObserver === "undefined") {
      for (const target of targets) target.dataset.inview = "true";
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || !(entry.target instanceof HTMLElement)) continue;
          entry.target.dataset.inview = "true";
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
    );
    for (const target of targets) observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let sample = window.scrollY;
    let current = "overview";
    return onFrame(({ scrollY }) => {
      const element = header.current;
      if (element && Math.abs(scrollY - sample) > 6) {
        element.dataset.hidden = scrollY > sample && scrollY > 220 ? "true" : "false";
        sample = scrollY;
      }
      let active = "overview";
      for (const id of chapters) {
        const top = document.getElementById(id)?.getBoundingClientRect().top;
        if (top !== undefined && top <= window.innerHeight * 0.5) active = id;
      }
      if (active === current) return;
      current = active;
      setChapter(active);
    });
  }, []);

  function navigate(event: MouseEvent<HTMLDivElement>) {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const origin = event.target instanceof Element ? event.target : null;
    const hash = origin?.closest('a[href^="#"]')?.getAttribute("href");
    const target = hash ? document.getElementById(hash.slice(1)) : null;
    if (!hash || !target) return;
    event.preventDefault();
    setMenuOpen(false);
    history.pushState(null, "", hash);
    const top =
      hash === "#overview" ? 0 : target.getBoundingClientRect().top + window.scrollY;
    scrollToY(top, paused);
    target.focus({ preventScroll: true });
  }

  return (
    <div
      className="experience"
      ref={root}
      data-motion={paused ? "paused" : "running"}
      data-ready={ready}
      onClick={navigate}
    >
      <a className="skip-link" href="#main">
        Skip to workspace
      </a>
      {intro && <Preloader onReveal={reveal} />}
      <ParticleField paused={paused} ready={ready} />
      <Grain />
      <Cursor paused={paused} />

      <header
        ref={header}
        className={`site-header${menuOpen ? " menu-open" : ""}`}
        onKeyDown={(event) => {
          if (event.key === "Escape" && menuOpen) {
            setMenuOpen(false);
            menuButton.current?.focus();
          }
        }}
      >
        <a className="wordmark" href="#overview" aria-label="Clueso Lab overview">
          clueso<i>*</i>
          <span>Lab</span>
        </a>
        <nav id="site-navigation" aria-label="Workspace navigation">
          {navigation.map((item, index) => (
            <a
              className="nav-link"
              key={item.id}
              href={`#${item.id}`}
              aria-current={chapter === item.id ? "location" : undefined}
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
            <i />
            <span>
              {reducedMotion ? "Motion reduced" : paused ? "Motion off" : "Motion on"}
            </span>
          </button>
          <a className="header-lab magnetic" ref={labLink} href="#diagnostic">
            Enter the lab <Icon name="arrow" />
          </a>
          <button
            className="menu-toggle"
            type="button"
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

      <main id="main" tabIndex={-1}>
        <section
          id="overview"
          className="hero"
          aria-labelledby="hero-title"
          data-form="0"
          data-form-wide="0.7 0.46 0.36"
          data-form-narrow="0.5 0.36 0.2"
          tabIndex={-1}
        >
          <div className="hero-meta">
            <span>
              <i className="live-dot" /> Independent prototype
            </span>
            <span>Vol. 03 &mdash; Stories in motion</span>
          </div>
          <h1 id="hero-title" aria-label="Show it. Keep it moving.">
            <span className="line">
              <span>Show it.</span>
            </span>
            <span className="line">
              <span>Keep it</span>
            </span>
            <span className="line">
              <span>
                <em>moving.</em>
              </span>
            </span>
          </h1>
          <div className="hero-foot">
            <p>
              Your product never stands still.
              <br />
              Why should its tutorials?
            </p>
            <a className="begin-link magnetic" ref={beginLink} href="#idea">
              <span>
                Begin
                <br />
                the story
              </span>
              <Icon name="arrow" />
            </a>
            <span className="hero-hint">
              Move your cursor.
              <br />
              The form is alive.
            </span>
          </div>
        </section>

        <Marquee paused={paused} />
        <Idea paused={paused} />
        <WorkflowPreview paused={paused} />
        <LiveLab />

        <section
          id="roadmap"
          className="boundaries"
          aria-labelledby="boundaries-title"
          tabIndex={-1}
        >
          <div data-reveal>
            <p className="label">04 &mdash; A note on what&apos;s real</p>
            <h2 id="boundaries-title">
              Big vision.
              <br />
              <em>Clear boundaries.</em>
            </h2>
          </div>
          <div className="boundaries-questions" data-reveal>
            <details className="roadmap-current" open>
              <summary>
                What can I actually try?
                <Icon name="plus" />
              </summary>
              <p>
                The live check connects this interface to a Java API and a migrated
                PostgreSQL database. The scroll-driven storyboard is a synthetic
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
            Keep your product moving.
            <br />
            Take the story with it.
          </span>
          <a href="#overview">
            Back to the top <Icon name="arrow" />
          </a>
        </div>
        <div className="footer-wordmark" aria-hidden="true" data-reveal>
          clueso<i>*</i>
        </div>
        <div className="footer-bottom">
          <span>Original concept / local prototype</span>
          <span>Not affiliated with Clueso.</span>
          <span>No recording. No publishing.</span>
        </div>
      </footer>

      <div className="rail" aria-hidden="true">
        {chapters.map((id) => (
          <span key={id} className={chapter === id ? "is-current" : undefined} />
        ))}
      </div>
    </div>
  );
}
