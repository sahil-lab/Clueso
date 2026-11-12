import { expect, test, type Page } from "@playwright/test";

async function prepareScreenshot(page: Page) {
  const pause = page.getByRole("button", { name: "Pause motion", exact: true });
  if (await pause.isVisible()) await pause.click();
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
}

test("production browser -> proxy -> API -> migrated PostgreSQL", async ({
  page,
}, testInfo) => {
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
  expect(errors).toEqual([]);
  await prepareScreenshot(page);
  await page.screenshot({ path: testInfo.outputPath("cover.png") });
  await page.screenshot({ path: testInfo.outputPath("desktop.png"), fullPage: true });
  await page.getByText("View response JSON").click();
  await expect(page.locator(".response-details pre")).toContainText('"schemaVersion": 1');
  await page.getByRole("button", { name: "Clear result" }).click();
  await expect(page.getByText("Not checked", { exact: true })).toHaveCount(2);
  await expect(page.getByText("Round trip complete")).toHaveCount(0);
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
  await page.goto("/");
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
  await page.goto("/");
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
  await prepareScreenshot(page);
  await page.screenshot({ path: testInfo.outputPath("mobile.png"), fullPage: true });
});

test("synthetic workflow supports keyboard navigation without server work", async ({
  page,
}) => {
  const mutations: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET") mutations.push(request.url());
  });
  await page.goto("/");
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

test("layout stays inside the viewport at mobile and tablet breakpoints", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  for (const width of [320, 520, 760, 768, 1024, 1440]) {
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
  await page.goto("/");
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
      ".runtime-copy p",
      ".preview-caption p",
      ".preview-disclaimer",
      ".field-help",
      ".idle-output p",
      ".diagnostic-footer code",
      ".roadmap-current > p",
    ].map((selector) => {
      const element = document.querySelector(selector);
      if (!element) throw new Error(`Missing contrast target: ${selector}`);
      let ancestor: Element | null = element;
      let background = [255, 255, 255];
      while (ancestor) {
        const color = rgb(getComputedStyle(ancestor).backgroundColor);
        if (color.length === 3 || color[3] === 1) {
          background = color;
          break;
        }
        ancestor = ancestor.parentElement;
      }
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

test("decorative motion can be stopped and respects the system preference", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.locator(".motion-artwork").hover({ position: { x: 90, y: 120 } });
  await expect
    .poll(() =>
      page
        .locator(".motion-artwork")
        .evaluate((element) =>
          Math.abs(Number.parseFloat(element.style.getPropertyValue("--tilt-x"))),
        ),
    )
    .toBeGreaterThan(0);
  await page.getByRole("button", { name: "Pause motion", exact: true }).click();
  await expect(page.locator(".experience")).toHaveAttribute("data-motion", "paused");
  await expect(page.locator(".loop-body")).toHaveCSS("animation-play-state", "paused");
  await expect
    .poll(() =>
      page
        .locator(".motion-artwork")
        .evaluate((element) => element.style.getPropertyValue("--tilt-x")),
    )
    .toBe("0deg");
  await page.getByRole("button", { name: "Resume motion" }).click();
  await expect(page.locator(".loop-body")).toHaveCSS("animation-play-state", "running");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(
    page.getByRole("button", { name: "Motion reduced by system preference" }),
  ).toBeDisabled();
  await expect(page.locator(".experience")).toHaveAttribute("data-motion", "paused");
  await expect(page.locator(".loop-body")).toHaveCSS("animation-name", "none");
});

test("editorial fonts load locally without external assets or console errors", async ({
  page,
}) => {
  const requested: string[] = [];
  const errors: string[] = [];
  page.on("request", (request) => requested.push(request.url()));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  const fonts = await page.evaluate(async () => {
    await document.fonts.ready;
    const loaded: string[] = [];
    document.fonts.forEach((face) => {
      if (face.status === "loaded") loaded.push(face.family);
    });
    return loaded;
  });
  expect(fonts.some((font) => font.includes("Anton"))).toBe(true);
  expect(fonts.some((font) => font.includes("Manrope Variable"))).toBe(true);
  const origin = new URL(page.url()).origin;
  expect(
    requested.filter((url) => url.startsWith("http") && new URL(url).origin !== origin),
  ).toEqual([]);
  expect(requested.some((url) => url.endsWith(".woff2"))).toBe(true);
  expect(errors).toEqual([]);
});
