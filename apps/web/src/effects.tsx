import { useEffect, useRef, useState, type RefObject } from "react";
import { onFrame } from "./motion";

const FINE_POINTER = "(hover: hover) and (pointer: fine)";

export function Preloader({ onReveal }: { onReveal: () => void }) {
  const [phase, setPhase] = useState<"counting" | "leaving" | "gone">("counting");
  const number = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (phase !== "counting") return;
    let frame = 0;
    let fontsLoaded = !("fonts" in document);
    if (!fontsLoaded) {
      void document.fonts.ready.then(() => {
        fontsLoaded = true;
      });
    }
    const started = performance.now();
    const step = (now: number) => {
      const elapsed = now - started;
      const linear = Math.min(elapsed / 1500, 1);
      const eased = 1 - Math.pow(1 - linear, 3);
      const value = fontsLoaded || elapsed > 4000 ? eased : Math.min(eased, 0.92);
      if (number.current) {
        number.current.textContent = String(Math.round(value * 100)).padStart(3, "0");
      }
      bar.current?.style.setProperty("--progress", value.toFixed(3));
      if (value >= 1) {
        setPhase("leaving");
        onReveal();
        return;
      }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [phase, onReveal]);

  useEffect(() => {
    if (phase !== "leaving") return;
    const timer = window.setTimeout(() => setPhase("gone"), 1200);
    return () => window.clearTimeout(timer);
  }, [phase]);

  if (phase === "gone") return null;
  return (
    <div
      className={`preloader${phase === "leaving" ? " is-leaving" : ""}`}
      aria-hidden="true"
    >
      <div className="preloader-top">
        <span>
          clueso<i>*</i>
        </span>
        <span>Stories in motion</span>
      </div>
      <div className="preloader-count">
        <span ref={number}>000</span>
      </div>
      <div className="preloader-bottom">
        <span className="preloader-bar">
          <span ref={bar} />
        </span>
        <span>Assembling 6 living forms</span>
      </div>
    </div>
  );
}

export function Cursor({ paused }: { paused: boolean }) {
  const dot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = dot.current;
    if (!element || paused || !window.matchMedia(FINE_POINTER).matches) return;
    let x = 0;
    let y = 0;
    let currentX = 0;
    let currentY = 0;
    let scale = 1;
    let targetScale = 1;
    let seen = false;
    const move = (event: PointerEvent) => {
      x = event.clientX;
      y = event.clientY;
      if (!seen) {
        seen = true;
        currentX = x;
        currentY = y;
        element.dataset.visible = "true";
      }
      const target = event.target instanceof Element ? event.target : null;
      const field = target?.closest("input, pre");
      const action = target?.closest("a, button, summary");
      targetScale = field ? 0.35 : action ? 2.6 : 1;
    };
    const leave = () => {
      seen = false;
      element.dataset.visible = "false";
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    const stop = onFrame(() => {
      currentX += (x - currentX) * 0.2;
      currentY += (y - currentY) * 0.2;
      scale += (targetScale - scale) * 0.16;
      element.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) scale(${scale})`;
    });
    return () => {
      stop();
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
      element.dataset.visible = "false";
    };
  }, [paused]);

  return <div className="cursor" ref={dot} aria-hidden="true" />;
}

export function Grain() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const element = canvas.current;
    if (!element || typeof CanvasRenderingContext2D === "undefined") return;
    const context = element.getContext("2d");
    const tile = document.createElement("canvas");
    tile.width = tile.height = 180;
    const tileContext = tile.getContext("2d");
    if (!context || !tileContext) return;
    const image = tileContext.createImageData(tile.width, tile.height);
    for (let index = 0; index < image.data.length; index += 4) {
      const value = Math.random() * 255;
      image.data[index] = value;
      image.data[index + 1] = value;
      image.data[index + 2] = value;
      image.data[index + 3] = 255;
    }
    tileContext.putImageData(image, 0, 0);
    const paint = () => {
      element.width = window.innerWidth;
      element.height = window.innerHeight;
      const pattern = context.createPattern(tile, "repeat");
      if (!pattern) return;
      context.fillStyle = pattern;
      context.fillRect(0, 0, element.width, element.height);
    };
    paint();
    window.addEventListener("resize", paint);
    return () => window.removeEventListener("resize", paint);
  }, []);

  return <canvas className="grain" ref={canvas} aria-hidden="true" />;
}

const PHRASES = ["Less re-recording", "More storytelling", "Always in motion"];

export function Marquee({ paused }: { paused: boolean }) {
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = track.current;
    if (!element || paused) return;
    let offset = 0;
    let direction = 1;
    return onFrame(({ delta, velocity }) => {
      const width = element.scrollWidth / 2;
      if (width === 0) return;
      if (Math.abs(velocity) > 0.03) direction = velocity > 0 ? 1 : -1;
      offset += direction * delta * (60 + Math.abs(velocity) * 900);
      offset = ((offset % width) + width) % width;
      const skew = Math.max(-10, Math.min(10, velocity * -5));
      element.style.transform = `translate3d(${-offset}px, 0, 0) skewX(${skew}deg)`;
    });
  }, [paused]);

  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track" ref={track}>
        {[0, 1].map((copy) => (
          <div className="marquee-group" key={copy}>
            {PHRASES.map((phrase, index) => (
              <span key={phrase} className={index === 1 ? "marquee-serif" : undefined}>
                {phrase}
                <i>*</i>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function useMagnetic<T extends HTMLElement>(paused: boolean): RefObject<T | null> {
  const target = useRef<T>(null);

  useEffect(() => {
    const element = target.current;
    if (!element || paused || !window.matchMedia(FINE_POINTER).matches) return;
    const move = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      const x = event.clientX - (rect.left + rect.width / 2);
      const y = event.clientY - (rect.top + rect.height / 2);
      element.style.setProperty("--mx", `${(x * 0.32).toFixed(1)}px`);
      element.style.setProperty("--my", `${(y * 0.32).toFixed(1)}px`);
    };
    const reset = () => {
      element.style.setProperty("--mx", "0px");
      element.style.setProperty("--my", "0px");
    };
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerleave", reset);
    return () => {
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerleave", reset);
      reset();
    };
  }, [paused]);

  return target;
}
