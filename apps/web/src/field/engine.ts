import { onFrame, type Frame } from "../motion";
import { backingRatio, fitPlacement, REACH, type Placement } from "./layout";
import {
  blurSource,
  compositeSource,
  fragmentSource,
  postVertexSource,
  vertexSource,
} from "./shaders";
import { FORM_COUNT, sampleForms } from "./shapes";

export interface FieldHandle {
  setPaused(paused: boolean): void;
  begin(): void;
  pulse(kind: "ok" | "error"): void;
  destroy(): void;
}

interface FieldHooks {
  onForm(index: number): void;
  onCount(count: number): void;
}

interface Stop {
  element: HTMLElement;
  form: number;
  wide: Placement;
  narrow: Placement;
}

interface Target {
  texture: WebGLTexture | null;
  framebuffer: WebGLFramebuffer | null;
  width: number;
  height: number;
}

const FIELD_OF_VIEW = (34 * Math.PI) / 180;
const DISTANCE = 7;
const BACKGROUND = [7 / 255, 9 / 255, 10 / 255] as const;
const BRIGHTNESS = [0.85, 0.72, 0.78, 0.78, 0.66, 0.3] as const;
// Scene, half, then a result and a scratch target for each of the three glow levels.
const GLOW_DIVISORS = [1, 2, 4, 4, 8, 8, 16, 16] as const;
const GLOW_STRENGTH = [0.35, 0.45, 0.6] as const;
const GLOW_CEILING = 1.5;
const GLOW_OPEN = 64;
const UNIFORMS = [
  "uProjection",
  "uTime",
  "uMorph",
  "uFly",
  "uScale",
  "uPixel",
  "uGlitch",
  "uIntro",
  "uPulse",
  "uPush",
  "uDistance",
  "uAlpha",
  "uLite",
  "uFrom",
  "uTo",
  "uOffset",
  "uTilt",
  "uPointer",
  "uPulseColor",
] as const;

function clamp(value: number, low = 0, high = 1) {
  return Math.min(high, Math.max(low, value));
}

function parsePlacement(value: string | undefined, fallback: Placement): Placement {
  const [x, y, radius] = (value ?? "").split(" ").map(Number);
  if (x === undefined || y === undefined || radius === undefined) return fallback;
  if (Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(radius)) return fallback;
  return [x, y, radius];
}

function readStops(): Stop[] {
  return Array.from(document.querySelectorAll<HTMLElement>("[data-form]")).map(
    (element) => ({
      element,
      form: clamp(Number(element.dataset.form) || 0, 0, FORM_COUNT - 1),
      wide: parsePlacement(element.dataset.formWide, [0.5, 0.5, 0.3]),
      narrow: parsePlacement(element.dataset.formNarrow, [0.5, 0.5, 0.24]),
    }),
  );
}

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Shader allocation failed.");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const reason = gl.getShaderInfoLog(shader) ?? "no compiler log";
    gl.deleteShader(shader);
    throw new Error(`Shader compilation failed: ${reason}`);
  }
  return shader;
}

function link(gl: WebGL2RenderingContext, vertexText: string, fragmentText: string) {
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexText);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentText);
  const program = gl.createProgram();
  if (!program) throw new Error("Program allocation failed.");
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const reason = gl.getProgramInfoLog(program) ?? "no linker log";
    gl.deleteProgram(program);
    throw new Error(`Program linking failed: ${reason}`);
  }
  return program;
}

function build(gl: WebGL2RenderingContext, count: number) {
  const program = link(gl, vertexSource, fragmentSource);
  const { forms, seeds } = sampleForms(count);
  const vertexArray = gl.createVertexArray();
  gl.bindVertexArray(vertexArray);
  const buffers = [...forms, seeds].map((data, location) => {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(
      location,
      location < FORM_COUNT ? 3 : 4,
      gl.FLOAT,
      false,
      0,
      0,
    );
    return buffer;
  });

  gl.useProgram(program);
  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);

  const locations = new Map<string, WebGLUniformLocation | null>();
  for (const name of UNIFORMS) locations.set(name, gl.getUniformLocation(program, name));

  return {
    uniform: (name: (typeof UNIFORMS)[number]) => locations.get(name) ?? null,
    bind() {
      gl.useProgram(program);
      gl.bindVertexArray(vertexArray);
    },
    dispose() {
      for (const buffer of buffers) gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vertexArray);
      gl.deleteProgram(program);
    },
  };
}

function prepare(gl: WebGL2RenderingContext, count: number) {
  try {
    return build(gl, count);
  } catch (error) {
    if (!(error instanceof Error)) throw error;
    console.error("particle_field_unavailable", error.message);
    return null;
  }
}

function buildGlow(gl: WebGL2RenderingContext) {
  // Half-float targets keep the dim end of the glow free of banding.
  const precise = gl.getExtension("EXT_color_buffer_float") !== null;
  const blur = link(gl, postVertexSource, blurSource);
  const composite = link(gl, postVertexSource, compositeSource);
  const vertexArray = gl.createVertexArray();
  const source = gl.getUniformLocation(blur, "uSource");
  const step = gl.getUniformLocation(blur, "uStep");
  const ceiling = gl.getUniformLocation(blur, "uCeiling");
  const targets: Target[] = [];

  gl.useProgram(composite);
  gl.uniform1i(gl.getUniformLocation(composite, "uScene"), 0);
  gl.uniform1i(gl.getUniformLocation(composite, "uTight"), 1);
  gl.uniform1i(gl.getUniformLocation(composite, "uMid"), 2);
  gl.uniform1i(gl.getUniformLocation(composite, "uWide"), 3);
  gl.uniform3f(gl.getUniformLocation(composite, "uBackground"), ...BACKGROUND);
  gl.uniform3f(gl.getUniformLocation(composite, "uGlow"), ...GLOW_STRENGTH);

  const release = () => {
    for (const target of targets) {
      gl.deleteFramebuffer(target.framebuffer);
      gl.deleteTexture(target.texture);
    }
    targets.length = 0;
  };

  const allocate = (width: number, height: number) => {
    const target: Target = {
      texture: gl.createTexture(),
      framebuffer: gl.createFramebuffer(),
      width,
      height,
    };
    targets.push(target);
    gl.bindTexture(gl.TEXTURE_2D, target.texture);
    gl.texStorage2D(gl.TEXTURE_2D, 1, precise ? gl.RGBA16F : gl.RGBA8, width, height);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      target.texture,
      0,
    );
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error("Glow target is incomplete.");
    }
  };

  const pass = (from: Target, to: Target, x: number, y: number, limit: number) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, to.framebuffer);
    gl.viewport(0, 0, to.width, to.height);
    gl.bindTexture(gl.TEXTURE_2D, from.texture);
    gl.uniform2f(step, x / to.width, y / to.height);
    gl.uniform1f(ceiling, limit);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  return {
    resize(width: number, height: number) {
      const scene = targets[0];
      if (scene?.width === width && scene.height === height) return;
      release();
      for (const divisor of GLOW_DIVISORS) {
        allocate(
          Math.max(1, Math.ceil(width / divisor)),
          Math.max(1, Math.ceil(height / divisor)),
        );
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    },
    capture() {
      gl.bindFramebuffer(gl.FRAMEBUFFER, targets[0]?.framebuffer ?? null);
    },
    present(width: number, height: number) {
      const [scene, half, tight, tightScratch, mid, midScratch, wide, wideScratch] =
        targets;
      if (!scene || !half || !tight || !tightScratch) return;
      if (!mid || !midScratch || !wide || !wideScratch) return;

      gl.disable(gl.BLEND);
      gl.bindVertexArray(vertexArray);
      gl.useProgram(blur);
      gl.activeTexture(gl.TEXTURE0);
      gl.uniform1i(source, 0);
      pass(scene, half, 0, 0, GLOW_CEILING);
      pass(half, tight, 0, 0, GLOW_OPEN);
      pass(tight, tightScratch, 1, 0, GLOW_OPEN);
      pass(tightScratch, tight, 0, 1, GLOW_OPEN);
      pass(tight, midScratch, 1, 0, GLOW_OPEN);
      pass(midScratch, mid, 0, 1, GLOW_OPEN);
      pass(mid, wideScratch, 1, 0, GLOW_OPEN);
      pass(wideScratch, wide, 0, 1, GLOW_OPEN);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, width, height);
      gl.useProgram(composite);
      [scene, tight, mid, wide].forEach((target, unit) => {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, target.texture);
      });
      gl.activeTexture(gl.TEXTURE0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.enable(gl.BLEND);
    },
    dispose() {
      release();
      gl.deleteProgram(blur);
      gl.deleteProgram(composite);
      gl.deleteVertexArray(vertexArray);
    },
  };
}

function prepareGlow(gl: WebGL2RenderingContext) {
  try {
    return buildGlow(gl);
  } catch (error) {
    if (!(error instanceof Error)) throw error;
    console.error("particle_glow_unavailable", error.message);
    return null;
  }
}

export function createField(
  canvas: HTMLCanvasElement,
  host: HTMLElement,
  hooks: FieldHooks,
): FieldHandle | null {
  host.dataset.state = "unsupported";
  if (typeof WebGL2RenderingContext === "undefined") return null;
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "high-performance",
  });
  if (!gl) return null;

  const info = gl.getExtension("WEBGL_debug_renderer_info");
  const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
  const software = /swiftshader|llvmpipe|software/i.test(renderer);
  const compact = window.matchMedia("(max-width: 760px), (pointer: coarse)").matches;
  // Software rasterizers get a lighter field so the page itself stays responsive.
  const count = software ? 6000 : compact ? 26000 : 60000;
  const floor = software ? 3000 : 9000;

  let resources = prepare(gl, count);
  if (!resources) return null;
  let glow = software ? null : prepareGlow(gl);

  host.dataset.state = "running";
  host.dataset.renderer = software ? "software" : "hardware";

  const projection = new Float32Array(16);
  let stops = readStops();
  let drawCount = count;
  let aspect = 1;
  let pixel = 1;
  let narrow = false;
  let viewWidth = 1;
  let viewHeight = 1;
  let paused = false;
  let dirty = true;
  let reported = false;
  let clock = 0;
  let path = 0;
  let intro = 0;
  let began = false;
  let pulse = 0;
  let pulseColor: readonly [number, number, number] = [0.78, 1, 0.3];
  let pointerX = 0;
  let pointerY = 0;
  let aimX = 0;
  let aimY = 0;
  let tiltX = 0;
  let tiltY = 0;
  let energy = 0;
  let push = 0;
  let activeForm = -1;
  let lastScroll = -1;
  let sampled = 0;
  let sampledTime = 0;
  let skipped = false;

  const dropGlow = () => {
    glow?.dispose();
    glow = null;
    host.dataset.glow = "off";
    dirty = true;
  };

  const resize = () => {
    const ratio = software
      ? 0.5
      : backingRatio(window.devicePixelRatio, canvas.clientWidth, canvas.clientHeight);
    const width = Math.max(1, Math.round(canvas.clientWidth * ratio));
    const height = Math.max(1, Math.round(canvas.clientHeight * ratio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    try {
      glow?.resize(width, height);
      host.dataset.glow = glow ? "on" : "off";
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      console.error("particle_glow_unavailable", error.message);
      dropGlow();
    }
    aspect = width / height;
    pixel = height / 760;
    viewWidth = Math.max(1, canvas.clientWidth);
    viewHeight = Math.max(1, canvas.clientHeight);
    narrow = viewWidth < 760;
    const focal = 1 / Math.tan(FIELD_OF_VIEW / 2);
    const near = 0.1;
    const far = 60;
    projection.fill(0);
    projection[0] = focal / aspect;
    projection[5] = focal;
    projection[10] = (far + near) / (near - far);
    projection[11] = -1;
    projection[14] = (2 * far * near) / (near - far);
    stops = readStops();
    dirty = true;
  };

  const measure = () => {
    const half = window.innerHeight / 2;
    let passed = -1;
    let previous = 0;
    let next = 0;
    for (let index = 0; index < stops.length; index++) {
      const stop = stops[index];
      if (!stop) continue;
      const rect = stop.element.getBoundingClientRect();
      const center = rect.top + rect.height / 2 - half;
      if (center > 0) {
        next = center;
        break;
      }
      passed = index;
      previous = center;
    }
    if (passed < 0) return 0;
    if (passed >= stops.length - 1) return stops.length - 1;
    const t = clamp((-previous / (next - previous) - 0.2) / 0.6);
    return passed + t * t * (3 - 2 * t);
  };

  const render = (frame: Frame) => {
    if (!resources || stops.length === 0) return;
    if (paused && !dirty && frame.scrollY === lastScroll) return;
    if (software && !paused) {
      skipped = !skipped;
      if (skipped) return;
    }
    lastScroll = frame.scrollY;
    dirty = false;

    const step = software ? frame.delta * 2 : frame.delta;
    const target = measure();
    if (paused) {
      path = Math.round(target);
      tiltX = tiltY = push = pulse = 0;
      if (began) intro = 1;
    } else {
      clock += step;
      const ease = Math.min(1, step * 6);
      path += (target - path) * ease;
      if (Math.abs(target - path) < 0.0004) path = target;
      if (began && intro < 1) intro = Math.min(1, intro + step / 2.8);
      if (pulse > 0) {
        pulse += step / 1.5;
        if (pulse >= 1) pulse = 0;
      }
      tiltX += (pointerY * 0.2 - tiltX) * ease * 0.6;
      tiltY += (pointerX * 0.32 - tiltY) * ease * 0.6;
      aimX += (pointerX - aimX) * ease;
      aimY += (pointerY - aimY) * ease;
      push += (energy - push) * 0.12;
      energy *= 0.94;
    }

    const index = Math.min(Math.floor(path), Math.max(0, stops.length - 2));
    const amount = clamp(path - index);
    const from = stops[index];
    const to = stops[index + 1] ?? from;
    if (!from || !to) return;

    const a = fitPlacement(
      narrow ? from.narrow : from.wide,
      REACH[from.form] ?? 0,
      viewWidth,
      viewHeight,
      narrow,
    );
    const b = fitPlacement(
      narrow ? to.narrow : to.wide,
      REACH[to.form] ?? 0,
      viewWidth,
      viewHeight,
      narrow,
    );
    const worldHeight = 2 * DISTANCE * Math.tan(FIELD_OF_VIEW / 2);
    const worldWidth = worldHeight * aspect;
    const x = a[0] + (b[0] - a[0]) * amount;
    const y = a[1] + (b[1] - a[1]) * amount;
    const radius = a[2] + (b[2] - a[2]) * amount;
    const brightA = BRIGHTNESS[from.form] ?? 0.5;
    const brightB = BRIGHTNESS[to.form] ?? 0.5;
    const density = Math.pow(clamp(60000 / drawCount, 1, 6), 0.55);
    const stale = (from.form === 1 ? 1 - amount : 0) + (to.form === 1 ? amount : 0);

    // With glow the scene is drawn on black and the composite adds the backdrop colour.
    const backdrop = glow ? 0 : 1;
    if (glow) glow.capture();
    else gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(
      BACKGROUND[0] * backdrop,
      BACKGROUND[1] * backdrop,
      BACKGROUND[2] * backdrop,
      1,
    );
    resources.bind();

    const { uniform } = resources;
    gl.uniformMatrix4fv(uniform("uProjection"), false, projection);
    gl.uniform1f(uniform("uTime"), clock);
    gl.uniform1f(uniform("uMorph"), amount);
    gl.uniform1f(uniform("uFly"), from.form === to.form ? 0 : 1);
    gl.uniform1f(uniform("uScale"), radius * worldHeight);
    gl.uniform1f(uniform("uPixel"), pixel);
    gl.uniform1f(uniform("uGlitch"), stale * stale);
    gl.uniform1f(uniform("uIntro"), intro);
    gl.uniform1f(uniform("uPulse"), pulse);
    gl.uniform1f(uniform("uPush"), push);
    gl.uniform1f(uniform("uDistance"), DISTANCE);
    gl.uniform1f(uniform("uAlpha"), (brightA + (brightB - brightA) * amount) * density);
    gl.uniform1f(uniform("uLite"), software ? 1 : 0);
    gl.uniform1i(uniform("uFrom"), from.form);
    gl.uniform1i(uniform("uTo"), to.form);
    gl.uniform2f(uniform("uOffset"), (x - 0.5) * worldWidth, (0.5 - y) * worldHeight);
    gl.uniform2f(uniform("uTilt"), tiltX, tiltY);
    gl.uniform2f(uniform("uPointer"), (aimX * worldWidth) / 2, (-aimY * worldHeight) / 2);
    gl.uniform3f(uniform("uPulseColor"), pulseColor[0], pulseColor[1], pulseColor[2]);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, drawCount);
    glow?.present(canvas.width, canvas.height);

    const form = amount < 0.5 ? from.form : to.form;
    if (form !== activeForm) {
      activeForm = form;
      hooks.onForm(form);
    }
    if (!reported) {
      reported = true;
      host.dataset.ready = "true";
      hooks.onCount(drawCount);
    }

    if (paused || intro < 1) return;
    sampled += 1;
    sampledTime += step;
    if (sampled < 60) return;
    const average = sampledTime / sampled;
    sampled = 0;
    sampledTime = 0;
    if (average <= (software ? 1 / 14 : 1 / 30)) return;
    if (drawCount > floor) {
      drawCount = Math.max(floor, Math.round(drawCount * 0.62));
      hooks.onCount(drawCount);
    } else if (glow) {
      dropGlow();
    }
  };

  const onPointer = (event: PointerEvent) => {
    if (event.pointerType === "touch" || paused) return;
    pointerX = (event.clientX / window.innerWidth) * 2 - 1;
    pointerY = (event.clientY / window.innerHeight) * 2 - 1;
    energy = Math.min(1, energy + Math.hypot(event.movementX, event.movementY) * 0.005);
  };
  const onLost = (event: Event) => {
    event.preventDefault();
    resources = null;
    glow = null;
    host.dataset.state = "unsupported";
  };
  const onRestored = () => {
    resources = prepare(gl, count);
    if (!resources) return;
    glow = software ? null : prepareGlow(gl);
    resize();
    host.dataset.state = "running";
  };

  resize();
  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", onPointer, { passive: true });
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);
  const stop = onFrame(render);

  return {
    setPaused(value) {
      paused = value;
      dirty = true;
    },
    begin() {
      began = true;
      dirty = true;
    },
    pulse(kind) {
      if (paused) return;
      pulse = 0.0001;
      pulseColor = kind === "ok" ? [0.78, 1, 0.3] : [1, 0.36, 0.22];
    },
    destroy() {
      stop();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      resources?.dispose();
      glow?.dispose();
    },
  };
}
