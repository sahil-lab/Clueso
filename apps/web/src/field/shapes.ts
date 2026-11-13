export const FORMS = [
  "Living loop",
  "Stale frame",
  "Capture",
  "Detect",
  "Review",
  "Foundation",
] as const;

export const FORM_COUNT = FORMS.length;

type Random = () => number;
type Pair = readonly [number, number];
type Triple = readonly [number, number, number];

function createRandom(seed: number): Random {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = state;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

function along(a: Pair, b: Pair, width: number, random: Random): Pair {
  const t = random();
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const length = Math.hypot(dx, dy) || 1;
  const offset = (random() - 0.5) * width;
  return [a[0] + dx * t - (dy / length) * offset, a[1] + dy * t + (dx / length) * offset];
}

function around(
  radius: number,
  width: number,
  random: Random,
  start = 0,
  sweep = Math.PI * 2,
): Pair {
  const angle = start + random() * sweep;
  const distance = radius + (random() - 0.5) * width;
  return [Math.cos(angle) * distance, Math.sin(angle) * distance];
}

function within(a: Pair, b: Pair, c: Pair, random: Random): Pair {
  let u = random();
  let v = random();
  if (u + v > 1) {
    u = 1 - u;
    v = 1 - v;
  }
  return [
    a[0] + (b[0] - a[0]) * u + (c[0] - a[0]) * v,
    a[1] + (b[1] - a[1]) * u + (c[1] - a[1]) * v,
  ];
}

function trace(points: readonly Pair[], closed: boolean) {
  const edges: { a: Pair; b: Pair; end: number }[] = [];
  let total = 0;
  const limit = closed ? points.length : points.length - 1;
  for (let index = 0; index < limit; index++) {
    const a = points[index];
    const b = points[(index + 1) % points.length];
    if (!a || !b) continue;
    total += Math.hypot(b[0] - a[0], b[1] - a[1]);
    edges.push({ a, b, end: total });
  }
  return (width: number, random: Random): Pair => {
    const mark = random() * total;
    const edge =
      edges.find((candidate) => mark <= candidate.end) ?? edges[edges.length - 1];
    return edge ? along(edge.a, edge.b, width, random) : [0, 0];
  };
}

function contains(points: readonly Pair[], x: number, y: number) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[i];
    const b = points[j];
    if (!a || !b) continue;
    const crosses = a[1] > y !== b[1] > y;
    if (crosses && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) {
      inside = !inside;
    }
  }
  return inside;
}

const STRANDS = 64;
const loop = (random: Random): Triple => [
  random(),
  ((Math.floor(random() * STRANDS) + 0.5) / STRANDS) * 2 - 1 + (random() - 0.5) * 0.01,
  random() * 2 - 1,
];

const FRAME_W = 1.2;
const FRAME_H = 0.74;
const PLAY: readonly [Pair, Pair, Pair] = [
  [-0.3, 0.4],
  [-0.3, -0.4],
  [0.42, 0],
];
const frameEdge = trace(
  [
    [-FRAME_W, FRAME_H],
    [FRAME_W, FRAME_H],
    [FRAME_W, -FRAME_H],
    [-FRAME_W, -FRAME_H],
  ],
  true,
);
const playEdge = trace(PLAY, true);
const frame = (random: Random): Triple => {
  const part = random();
  const depth = (random() - 0.5) * 0.05;
  if (part < 0.3) {
    const [x, y] = frameEdge(0.03, random);
    return [x, y, depth];
  }
  if (part < 0.5) {
    const [x, y] = playEdge(0.035, random);
    return [x, y, depth + 0.12];
  }
  if (part < 0.66) {
    const [x, y] = within(PLAY[0], PLAY[1], PLAY[2], random);
    return [x, y, depth + 0.12];
  }
  if (part < 0.8) {
    const played = random() < 0.6;
    const x = played ? -1.02 + random() * 0.8 : -0.22 + random() * 1.24;
    return [x, -0.56 + (random() - 0.5) * (played ? 0.035 : 0.012), depth];
  }
  const row = Math.floor(random() * 15);
  return [
    (random() * 2 - 1) * (FRAME_W - 0.12),
    0.6 - row * 0.072 + (random() - 0.5) * 0.006,
    depth - 0.1,
  ];
};

const ARROW: readonly Pair[] = (
  [
    [0, 0],
    [0, 0.8],
    [0.2, 0.62],
    [0.34, 0.93],
    [0.47, 0.87],
    [0.33, 0.57],
    [0.6, 0.57],
  ] satisfies Pair[]
).map(([x, y]): Pair => [(x - 0.3) * 1.8 + 0.12, (0.465 - y) * 1.8 - 0.12]);
const TIP: Pair = [-0.42, 0.717];
const arrowEdge = trace(ARROW, true);
const cursor = (random: Random): Triple => {
  const part = random();
  const depth = (random() - 0.5) * 0.05;
  if (part < 0.46) {
    const [x, y] = arrowEdge(0.04, random);
    return [x, y, depth];
  }
  if (part < 0.78) {
    for (let attempt = 0; attempt < 24; attempt++) {
      const x = -0.42 + random() * 1.08;
      const y = -0.96 + random() * 1.68;
      if (contains(ARROW, x, y)) return [x, y, depth];
    }
    const [x, y] = arrowEdge(0.04, random);
    return [x, y, depth];
  }
  const [x, y] = around(random() < 0.55 ? 0.46 : 0.27, 0.022, random, 1.3, 2.1);
  return [TIP[0] + x, TIP[1] + y, depth - 0.06];
};

const DELTA: readonly Pair[] = [
  [0, 0.98],
  [-1.02, -0.78],
  [1.02, -0.78],
];
const deltaEdge = trace(DELTA, true);
const innerEdge = trace(
  DELTA.map(([x, y]): Pair => [x * 0.42, (y + 0.19) * 0.42 - 0.19]),
  true,
);
const delta = (random: Random): Triple => {
  const depth = (random() - 0.5) * 0.05;
  if (random() < 0.8) {
    const [x, y] = deltaEdge(0.16, random);
    return [x, y, depth];
  }
  const [x, y] = innerEdge(0.05, random);
  return [x, y, depth + 0.16];
};

const checkStroke = trace(
  [
    [-0.5, 0.02],
    [-0.14, -0.36],
    [0.54, 0.44],
  ],
  false,
);
const check = (random: Random): Triple => {
  const depth = (random() - 0.5) * 0.05;
  if (random() < 0.42) {
    const [x, y] = around(1.02, 0.05, random);
    return [x, y, depth - 0.08];
  }
  const [x, y] = checkStroke(0.17, random);
  return [x, y, depth + 0.08];
};

const ROWS = 72;
const field = (random: Random): Triple => [
  (random() * 2 - 1) * 3.6,
  0,
  -3 + (Math.floor(random() * ROWS) / (ROWS - 1)) * 4.6 + (random() - 0.5) * 0.004,
];

const samplers = [loop, frame, cursor, delta, check, field] as const;

export function sampleForms(count: number) {
  const forms = samplers.map((sample, index) => {
    const random = createRandom(101 + index * 977);
    const data = new Float32Array(count * 3);
    for (let particle = 0; particle < count; particle++) {
      const [x, y, z] = sample(random);
      data[particle * 3] = x;
      data[particle * 3 + 1] = y;
      data[particle * 3 + 2] = z;
    }
    return data;
  });
  const random = createRandom(7);
  const seeds = new Float32Array(count * 4);
  for (let index = 0; index < seeds.length; index++) seeds[index] = random();
  return { forms, seeds };
}
