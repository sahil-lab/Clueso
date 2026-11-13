import { expect, it } from "vitest";
import { FORM_COUNT, sampleForms } from "./shapes";

it("samples every form deterministically with finite, bounded coordinates", () => {
  const first = sampleForms(4000);
  const second = sampleForms(4000);

  expect(first.forms).toHaveLength(FORM_COUNT);
  expect(first.seeds).toHaveLength(4000 * 4);
  for (const [index, form] of first.forms.entries()) {
    expect(form).toHaveLength(4000 * 3);
    expect(Array.from(form)).toEqual(Array.from(second.forms[index] ?? []));
    expect(form.every((value) => Number.isFinite(value) && Math.abs(value) <= 4)).toBe(
      true,
    );
  }
  expect(first.seeds.every((value) => value >= 0 && value < 1)).toBe(true);
});

it("gives each form its own distinct silhouette", () => {
  const { forms } = sampleForms(2000);
  const widths = forms.map((form) => {
    let low = Infinity;
    let high = -Infinity;
    for (let index = 0; index < form.length; index += 3) {
      const x = form[index] ?? 0;
      low = Math.min(low, x);
      high = Math.max(high, x);
    }
    return high - low;
  });
  const [loop, frame, cursor, delta, check, field] = widths;
  expect(loop).toBeCloseTo(1, 1);
  expect(frame).toBeGreaterThan(2.3);
  expect(cursor).toBeLessThan(1.6);
  expect(delta).toBeGreaterThan(2);
  expect(check).toBeGreaterThan(2);
  expect(field).toBeGreaterThan(7);
});
