import { describe, expect, it } from "vitest";
import { backingRatio, fitPlacement, REACH } from "./layout";

const HUD_EDGE = 56;

function rightEdge(placement: readonly number[], reach: number, w: number, h: number) {
  const [x = 0, , radius = 0] = placement;
  return x * w + reach * radius * h;
}

describe("backingRatio", () => {
  it("follows the device pixel ratio up to the sharpness ceiling", () => {
    expect(backingRatio(1, 1280, 720)).toBe(1);
    expect(backingRatio(1.5, 1024, 768)).toBe(1.5);
    expect(backingRatio(3, 390, 844)).toBe(1.75);
    expect(backingRatio(0, 1280, 720)).toBe(1);
  });

  it("bounds the backing store on very large viewports", () => {
    const ratio = backingRatio(1.5, 2560, 1440);
    expect(ratio).toBeLessThan(1);
    expect(2560 * ratio * 1440 * ratio).toBeCloseTo(3_400_000, 0);
    expect(backingRatio(1, 3840, 2160)).toBeCloseTo(Math.sqrt(3_400_000 / 8_294_400), 9);
  });
});

describe("fitPlacement", () => {
  it("leaves a placement untouched when the form already fits a wide viewport", () => {
    expect(fitPlacement([0.7, 0.46, 0.36], REACH[0], 1440, 900, false)).toEqual([
      0.7, 0.46, 0.36,
    ]);
  });

  it("shrinks and shifts a form so it clears the HUD on a 4:3 viewport", () => {
    const stale = [0.8, 0.47, 0.2] as const;
    expect(rightEdge(stale, REACH[1], 1024, 768)).toBeGreaterThan(1024 - HUD_EDGE);

    const fitted = fitPlacement(stale, REACH[1], 1024, 768, false);
    expect(fitted[2]).toBeCloseTo(0.2 * (1024 / 768 / 1.6), 6);
    expect(rightEdge(fitted, REACH[1], 1024, 768)).toBeLessThanOrEqual(
      1024 - HUD_EDGE + 0.001,
    );
    expect(fitted[1]).toBe(0.47);
  });

  it("centers a form that is wider than the space between both clearances", () => {
    const [x, , radius] = fitPlacement([0.8, 0.3, 0.3], REACH[1], 390, 844, true);
    expect(x).toBe(0.5);
    expect(radius).toBe(0.3);
  });

  it("never moves or scales the unbounded foundation terrain", () => {
    const terrain = [0.5, 0.92, 0.42] as const;
    expect(fitPlacement(terrain, REACH[5], 1024, 768, false)).toBe(terrain);
  });
});
