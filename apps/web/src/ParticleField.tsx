import { useEffect, useRef, useState } from "react";
import { createField, type FieldHandle } from "./field/engine";
import { FORMS } from "./field/shapes";

const LOOP =
  "M 513 235 C 471 111 310 64 196 174 C 79 285 144 464 293 489 C 432 512 541 412 521 321 C 505 247 409 215 356 285";

export default function ParticleField({
  paused,
  ready,
}: {
  paused: boolean;
  ready: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const field = useRef<FieldHandle | null>(null);
  const [form, setForm] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!host.current || !canvas.current) return;
    const handle = createField(canvas.current, host.current, {
      onForm: setForm,
      onCount: setCount,
    });
    field.current = handle;
    const onPulse = (event: Event) => {
      if (event instanceof CustomEvent) {
        handle?.pulse(event.detail === "error" ? "error" : "ok");
      }
    };
    window.addEventListener("clueso:pulse", onPulse);
    return () => {
      window.removeEventListener("clueso:pulse", onPulse);
      handle?.destroy();
      field.current = null;
    };
  }, []);

  useEffect(() => {
    field.current?.setPaused(paused);
  }, [paused]);

  useEffect(() => {
    if (ready) field.current?.begin();
  }, [ready]);

  return (
    <>
      <div className="field" ref={host} aria-hidden="true">
        <canvas ref={canvas} />
        <svg className="field-fallback" viewBox="0 0 680 640" fill="none">
          <path d={LOOP} stroke="#c8ff4d" strokeOpacity=".16" strokeWidth="118" />
          <path
            d={LOOP}
            stroke="#c8ff4d"
            strokeOpacity=".5"
            strokeWidth="118"
            strokeDasharray="1.2 9"
          />
        </svg>
      </div>
      <div className="hud" aria-hidden="true">
        <span>
          FORM 0{form + 1} / 0{FORMS.length}
        </span>
        <strong>{FORMS[form]}</strong>
        <span>
          {count > 0
            ? `${count.toLocaleString("en-US")} live particles`
            : "Static artwork"}
        </span>
      </div>
    </>
  );
}
