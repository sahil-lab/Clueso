export type Placement = readonly [x: number, y: number, radius: number];

// Horizontal reach of each form in multiples of its radius; 0 marks a form that may bleed off screen.
export const REACH = [1.12, 1.3, 0.9, 1.1, 1.06, 0] as const;

const REFERENCE_ASPECT = 1.6;
const SMALLEST_FIT = 0.72;
const HUD_CLEARANCE = 56;
const EDGE_CLEARANCE = 16;
const SHARPEST_RATIO = 1.75;
const MOST_BACKING_PIXELS = 3_400_000;

// Soft additive sprites do not need every device pixel; bounding the backing store keeps
// fill cost predictable on 4K displays.
export function backingRatio(devicePixelRatio: number, width: number, height: number) {
  const density = Math.min(devicePixelRatio > 0 ? devicePixelRatio : 1, SHARPEST_RATIO);
  const area = Math.max(1, width * height);
  return Math.min(density, Math.sqrt(MOST_BACKING_PIXELS / area));
}

export function fitPlacement(
  placement: Placement,
  reach: number,
  width: number,
  height: number,
  narrow: boolean,
): Placement {
  const [x, y, radius] = placement;
  if (reach === 0) return placement;
  const fit = narrow
    ? 1
    : Math.min(1, Math.max(SMALLEST_FIT, width / height / REFERENCE_ASPECT));
  const fitted = radius * fit;
  const span = (reach * fitted * height) / width;
  const low = EDGE_CLEARANCE / width + span;
  const high = 1 - (narrow ? EDGE_CLEARANCE : HUD_CLEARANCE) / width - span;
  return [low > high ? 0.5 : Math.min(high, Math.max(low, x)), y, fitted];
}
