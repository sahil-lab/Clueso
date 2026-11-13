import { expect, test, type Page } from "@playwright/test";

async function open(page: Page) {
  await page.goto("/");
  await expect(page.locator(".preloader")).toHaveCount(0, { timeout: 12_000 });
}

async function scrollToY(page: Page, top: number) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), top);
}

async function freeze(page: Page) {
  await scrollToY(page, 0);
  const pause = page.getByRole("button", { name: "Pause motion", exact: true });
  if (await pause.isVisible()) await pause.click();
  await page.evaluate(async () => {
    await document.fonts.ready;
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });
}

async function workflowTrack(page: Page) {
  return page.evaluate(() => {
    const section = document.querySelector("#preview");
    if (!section) throw new Error("Workflow section is missing.");
    const rect = section.getBoundingClientRect();
    return { start: rect.top + window.scrollY, length: rect.height - window.innerHeight };
  });
}

test("production browser -> proxy -> API -> migrated PostgreSQL", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const navigation = await page.goto("/");
  expect(navigation?.status()).toBe(200);
  expect(navigation?.headers()["content-security-policy"]).toContain(
    "frame-ancestors 'none'",
  );
  await expect(
    page.getByRole("heading", { name: "Show it. Keep it moving." }),
  ).toBeVisible();
  await expect(page.locator(".preloader")).toHaveCount(0, { timeout: 12_000 });
  await expect(page.getByText("Not checked", { exact: true })).toHaveCount(2);
  await page.getByLabel("Synthetic check label").fill("browser-smoke");

  const responsePromise = page.waitForResponse("**/api/v1/system/check");
  await page.getByRole("button", { name: "Run check" }).click();
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({
    service: "clueso-api",
    status: "ready",
    label: "browser-smoke",
    schemaVersion: 1,
  });
  await expect(page.getByText("Round trip complete")).toBeVisible();
  await expect(page.getByText("Verified", { exact: true })).toHaveCount(2);
  await page.getByText("View response JSON").click();
  await expect(page.locator(".response-details pre")).toContainText('"schemaVersion": 1');
  await page.getByRole("button", { name: "Clear result" }).click();
  await expect(page.getByText("Not checked", { exact: true })).toHaveCount(2);
  await expect(page.getByText("Round trip complete")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("real API rejects invalid input without echoing it", async ({ request }) => {
  for (const body of [
    {},
    { label: null },
    { label: "   " },
    { label: "a".repeat(65) },
    { label: "<script>private-input</script>" },
    { label: 42 },
    { label: "synthetic", unknown: "private-input" },
  ]) {
    const response = await request.post("/api/v1/system/check", { data: body });
    expect(response.status()).toBe(400);
    expect(response.headers()["content-type"]).toContain("application/problem+json");
    const text = await response.text();
    expect(text).not.toContain("private-input");
    expect(JSON.parse(text)).toMatchObject({ status: 400 });
  }
  const malformed = await request.post("/api/v1/system/check", {
    headers: { "Content-Type": "application/json" },
    data: '{"label":',
  });
  expect(malformed.status()).toBe(400);
  const boundary = await request.post("/api/v1/system/check", {
    data: { label: "a".repeat(64) },
  });
  expect(boundary.status()).toBe(200);
});

test("browser network failure is visible and an explicit retry succeeds", async ({
  page,
}) => {
  await open(page);
  await page.route("**/api/v1/system/check", (route) => route.abort("failed"), {
    times: 1,
  });
  await page.getByRole("button", { name: "Run check" }).click();
  await expect(page.getByRole("alert")).toContainText("Cannot reach the local API");
  await expect(page.getByText("Round trip complete")).toHaveCount(0);
  await page.getByRole("button", { name: "Run check" }).click();
  await expect(page.getByText("Round trip complete")).toBeVisible();
});

test("mobile layout supports the same real diagnostic without horizontal overflow", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("button", { name: "Close navigation" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Open navigation" })).toBeFocused();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("link", { name: "Workflow preview" }).click();
  await expect(page.getByRole("button", { name: "Open navigation" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await expect(page).toHaveURL(/#preview$/);
  await page.getByLabel("Synthetic check label").fill("mobile-smoke");
  await page.getByRole("button", { name: "Run check" }).click();
  await expect(page.getByText("Round trip complete")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("mobile-lab.png") });
  await freeze(page);
  await page.screenshot({ path: testInfo.outputPath("mobile-cover.png") });
});

test("synthetic workflow supports keyboard navigation without server work", async ({
  page,
}) => {
  const mutations: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET") mutations.push(request.url());
  });
  await open(page);
  await page.getByRole("tab", { name: /Capture/ }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: /Detect/ })).toBeFocused();
  await expect(page.getByRole("tabpanel")).toContainText("not an executed diff");
  await page.keyboard.press("End");
  await expect(page.getByRole("tab", { name: /Review/ })).toBeFocused();
  await expect(page.getByRole("tabpanel")).toContainText("No recording or publishing");
  await page.keyboard.press("Home");
  await expect(page.getByRole("tab", { name: /Capture/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByText("Not checked", { exact: true })).toHaveCount(2);
  expect(mutations).toEqual([]);
});

test("scrolling the pinned workflow advances capture, detect, then review", async ({
  page,
}) => {
  await open(page);
  const track = await workflowTrack(page);
  expect(track.length).toBeGreaterThan(0);
  for (const [index, name] of ["Capture", "Detect", "Review"].entries()) {
    await scrollToY(page, track.start + ((index + 0.5) / 3) * track.length);
    await expect(page.getByRole("tab", { name })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.getByRole("tab", { name })).toBeInViewport();
  }
  await scrollToY(page, track.start + track.length / 6);
  await expect(page.getByRole("tab", { name: "Capture" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test("layout stays inside the viewport at mobile and tablet breakpoints", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".preloader")).toHaveCount(0);
  for (const width of [320, 520, 760, 768, 901, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
      `No horizontal overflow at ${width}px`,
    ).toBe(true);
  }
});

test("essential interface text has readable contrast", async ({ page }, testInfo) => {
  await open(page);
  const readings = await page.evaluate(() => {
    function rgb(value: string): number[] {
      return (value.match(/[\d.]+/g) ?? []).map(Number);
    }
    function luminance(channels: number[]) {
      const linear = channels.slice(0, 3).map((value) => {
        const channel = value / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      });
      return linear.reduce(
        (sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index]!,
        0,
      );
    }
    return [
      ".nav-link",
      ".hero-foot p",
      ".statement",
      ".runtime-copy p",
      ".preview-caption p",
      ".preview-disclaimer",
      ".lab-description",
      ".field-help",
      ".idle-output p",
      ".diagnostic-footer code",
      ".roadmap-current > p",
      ".footer-bottom",
    ].map((selector) => {
      const element = document.querySelector(selector);
      if (!element) throw new Error(`Missing contrast target: ${selector}`);
      let ancestor: Element | null = element;
      let background: number[] | null = null;
      while (ancestor && !background) {
        const color = rgb(getComputedStyle(ancestor).backgroundColor);
        if (color.length === 3 || color[3] === 1) background = color;
        ancestor = ancestor.parentElement;
      }
      if (!background) throw new Error(`No solid background behind ${selector}`);
      const foreground = luminance(rgb(getComputedStyle(element).color));
      const backdrop = luminance(background);
      return {
        selector,
        ratio:
          (Math.max(foreground, backdrop) + 0.05) /
          (Math.min(foreground, backdrop) + 0.05),
      };
    });
  });
  await testInfo.attach("essential-text-contrast", {
    body: JSON.stringify(readings, null, 2),
    contentType: "application/json",
  });
  for (const reading of readings) {
    expect(reading.ratio, `${reading.selector} contrast`).toBeGreaterThanOrEqual(4.5);
  }
});

test("motion can be stopped, resumed, and follows the system preference", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await open(page);
  const experience = page.locator(".experience");
  const marquee = page.locator(".marquee-track");
  const position = () => marquee.evaluate((element) => element.style.transform);

  await expect(experience).toHaveAttribute("data-motion", "running");
  await expect(page.locator("html")).toHaveClass(/lenis/);
  const moving = await position();
  await expect.poll(position).not.toBe(moving);

  await page.getByRole("button", { name: "Pause motion", exact: true }).click();
  await expect(experience).toHaveAttribute("data-motion", "paused");
  await expect(page.locator("html")).not.toHaveClass(/lenis/);
  const stopped = await position();
  await page.waitForTimeout(300);
  expect(await position()).toBe(stopped);

  await page.getByRole("button", { name: "Resume motion" }).click();
  await expect(experience).toHaveAttribute("data-motion", "running");
  await expect.poll(position).not.toBe(stopped);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(
    page.getByRole("button", { name: "Motion reduced by system preference" }),
  ).toBeDisabled();
  await expect(experience).toHaveAttribute("data-motion", "paused");

  await page.reload();
  await expect(page.locator(".preloader")).toHaveCount(0);
  await expect(page.locator(".experience")).toHaveAttribute("data-ready", "true");
});

test("fonts load locally without external assets or console errors", async ({ page }) => {
  const requested: string[] = [];
  const errors: string[] = [];
  page.on("request", (request) => requested.push(request.url()));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await open(page);
  const fonts = await page.evaluate(async () => {
    await document.fonts.ready;
    const loaded: string[] = [];
    document.fonts.forEach((face) => {
      if (face.status === "loaded") loaded.push(face.family);
    });
    return loaded;
  });
  expect(fonts.some((font) => font.includes("Manrope Variable"))).toBe(true);
  expect(fonts.some((font) => font.includes("Instrument Serif"))).toBe(true);
  const origin = new URL(page.url()).origin;
  expect(
    requested.filter((url) => url.startsWith("http") && new URL(url).origin !== origin),
  ).toEqual([]);
  expect(requested.some((url) => url.endsWith(".woff2"))).toBe(true);
  expect(errors).toEqual([]);
});

test("particle field renders live forms or degrades to static artwork", async ({
  page,
}, testInfo) => {
  await open(page);
  const field = page.locator(".field");
  await expect(field).toHaveAttribute("data-state", /^(running|unsupported)$/);
  const state = await field.getAttribute("data-state");
  const renderer = await field.getAttribute("data-renderer");
  const glow = await field.getAttribute("data-glow");
  testInfo.annotations.push({
    type: "particle-field",
    description: `${state ?? "unknown"} / ${renderer ?? "no renderer"} / glow ${glow ?? "n/a"}`,
  });

  if (state === "unsupported") {
    await expect(page.locator(".field-fallback")).toBeVisible();
    await expect(page.locator(".hud")).toContainText("Static artwork");
    return;
  }

  // Software rasterizers keep the lighter profile: no glow passes.
  await expect(field).toHaveAttribute(
    "data-glow",
    renderer === "software" ? "off" : /^(on|off)$/,
  );
  await expect(field).toHaveAttribute("data-ready", "true");
  await expect(page.locator(".hud")).toContainText(/[\d,]+ live particles/);
  await expect(page.locator(".hud strong")).toHaveText("Living loop");

  const track = await workflowTrack(page);
  const tops = await page.evaluate(() => {
    const top = (selector: string) => {
      const element = document.querySelector(selector);
      if (!element) throw new Error(`Missing section: ${selector}`);
      const rect = element.getBoundingClientRect();
      return rect.top + window.scrollY + (rect.height - window.innerHeight) / 2;
    };
    return { idea: top("#idea"), lab: top("#diagnostic") };
  });
  const tour: [string, number, string][] = [
    ["1-loop", 0, "Living loop"],
    ["2-stale-frame", tops.idea, "Stale frame"],
    ["3-capture", track.start + track.length / 6, "Capture"],
    ["4-detect", track.start + track.length / 2, "Detect"],
    ["5-review", track.start + (track.length * 5) / 6, "Review"],
    ["6-foundation", tops.lab, "Foundation"],
  ];
  for (const [name, top, form] of tour) {
    await scrollToY(page, top);
    await expect(page.locator(".hud strong")).toHaveText(form);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: testInfo.outputPath(`tour-${name}.png`) });
  }
});
