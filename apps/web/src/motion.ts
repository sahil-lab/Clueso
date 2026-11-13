import Lenis from "lenis";

export interface Frame {
  time: number;
  delta: number;
  scrollY: number;
  velocity: number;
}

type Listener = (frame: Frame) => void;

const listeners = new Set<Listener>();
let lenis: Lenis | null = null;
let request = 0;
let previousTime = 0;
let previousScroll = 0;
let velocity = 0;

function tick(now: number) {
  request = requestAnimationFrame(tick);
  const elapsed = Math.min(Math.max(now - previousTime, 1), 64);
  previousTime = now;
  lenis?.raf(now);
  const scrollY = window.scrollY;
  velocity += ((scrollY - previousScroll) / elapsed - velocity) * 0.2;
  previousScroll = scrollY;
  const frame: Frame = { time: now / 1000, delta: elapsed / 1000, scrollY, velocity };
  for (const listener of listeners) listener(frame);
}

export function onFrame(listener: Listener): () => void {
  listeners.add(listener);
  if (listeners.size === 1) {
    previousTime = performance.now();
    previousScroll = window.scrollY;
    velocity = 0;
    request = requestAnimationFrame(tick);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) cancelAnimationFrame(request);
  };
}

export function setSmoothScroll(enabled: boolean) {
  if (enabled === (lenis !== null)) return;
  if (enabled) {
    lenis = new Lenis({ autoRaf: false, lerp: 0.105, wheelMultiplier: 0.95 });
    return;
  }
  lenis?.destroy();
  lenis = null;
}

export function scrollToY(top: number, immediate: boolean) {
  if (lenis && !immediate) {
    lenis.scrollTo(top, { duration: 1.25 });
    return;
  }
  window.scrollTo({ top, behavior: immediate ? "instant" : "smooth" });
}
