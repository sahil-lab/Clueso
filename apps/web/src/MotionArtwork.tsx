import { useEffect, useRef, type PointerEvent } from "react";
import { Icon } from "./Icon";

const loop =
  "M 513 235 C 471 111 310 64 196 174 C 79 285 144 464 293 489 C 432 512 541 412 521 321 C 505 247 409 215 356 285";

export default function MotionArtwork({ paused }: { paused: boolean }) {
  const stage = useRef<HTMLDivElement>(null);

  function resetTilt() {
    stage.current?.style.setProperty("--tilt-x", "0deg");
    stage.current?.style.setProperty("--tilt-y", "0deg");
  }

  useEffect(() => {
    if (paused) resetTilt();
  }, [paused]);

  function tilt(event: PointerEvent<HTMLDivElement>) {
    if (paused || event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    event.currentTarget.style.setProperty("--tilt-x", `${-y * 12}deg`);
    event.currentTarget.style.setProperty("--tilt-y", `${x * 16}deg`);
  }

  return (
    <div
      className="motion-artwork"
      ref={stage}
      onPointerMove={tilt}
      onPointerLeave={resetTilt}
      aria-hidden="true"
    >
      <div className="art-coordinate coordinate-top">FIG. 001 / THE LIVING LOOP</div>
      <span className="art-cross cross-one">+</span>
      <span className="art-cross cross-two">+</span>
      <span className="orbit-line orbit-line-one" />
      <span className="orbit-line orbit-line-two" />
      <div className="sculpture-tilt">
        <svg className="loop-sculpture" viewBox="0 0 680 640" fill="none">
          <defs>
            <linearGradient
              id="loop-material"
              x1="150"
              y1="130"
              x2="540"
              y2="515"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#efffc1" />
              <stop offset=".2" stopColor="#c8ed72" />
              <stop offset=".43" stopColor="#a2c742" />
              <stop offset=".58" stopColor="#354a1c" />
              <stop offset=".7" stopColor="#8eae37" />
              <stop offset=".88" stopColor="#d9ff91" />
              <stop offset="1" stopColor="#a4cd4e" />
            </linearGradient>
            <linearGradient
              id="loop-light"
              x1="145"
              y1="185"
              x2="510"
              y2="380"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#fff" stopOpacity=".65" />
              <stop offset=".42" stopColor="#fff" stopOpacity="0" />
              <stop offset="1" stopColor="#edffb7" stopOpacity=".28" />
            </linearGradient>
            <radialGradient id="ground-shadow">
              <stop stopColor="#273717" stopOpacity=".25" />
              <stop offset="1" stopColor="#273717" stopOpacity="0" />
            </radialGradient>
            <filter id="tube-shadow" x="-30%" y="-30%" width="160%" height="170%">
              <feDropShadow
                dx="9"
                dy="20"
                stdDeviation="14"
                floodColor="#354322"
                floodOpacity=".2"
              />
            </filter>
          </defs>
          <ellipse
            className="loop-shadow"
            cx="354"
            cy="573"
            rx="248"
            ry="43"
            fill="url(#ground-shadow)"
          />
          <g className="loop-body" filter="url(#tube-shadow)">
            <path d={loop} stroke="#435922" strokeWidth="124" strokeLinecap="round" />
            <path
              d={loop}
              stroke="url(#loop-material)"
              strokeWidth="121"
              strokeLinecap="round"
            />
            <path
              d={loop}
              stroke="#233411"
              strokeOpacity=".31"
              strokeWidth="121"
              strokeDasharray="1.3 8"
            />
            <path
              d={loop}
              stroke="#f3ffc5"
              strokeOpacity=".25"
              strokeWidth="121"
              strokeDasharray=".8 8.5"
              strokeDashoffset="3"
            />
            <path
              d={loop}
              stroke="url(#loop-light)"
              strokeWidth="92"
              strokeLinecap="round"
            />
          </g>
        </svg>
        <div className="art-film">
          <div className="art-film-top">
            <span className="dot" /> A STORY IN PROGRESS <Icon name="film" />
          </div>
          <div className="art-film-image">
            <span className="film-grid" />
            <strong>
              MAKE
              <br />
              IT CLICK.
            </strong>
            <span className="film-play">
              <Icon name="play" />
            </span>
            <span className="film-star">*</span>
          </div>
          <div className="art-film-bottom">
            <span>01: THE FIRST STEP</span>
            <span>CONCEPT / 2026</span>
          </div>
        </div>
        <div className="art-sticker">
          <Icon name="refresh" />
          <span>
            SAME STORY.
            <br />
            <strong>NEXT CHAPTER.</strong>
          </span>
        </div>
      </div>
      <div className="art-coordinate coordinate-bottom">
        <span className="tiny-square" /> ORIGINAL MOTION STUDY<span>001 &mdash; 003</span>
      </div>
    </div>
  );
}
