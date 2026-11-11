import { expect, test } from "@playwright/test";

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
    page.getByRole("heading", { name: "Start with a solid foundation." }),
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
  await page.screenshot({ path: testInfo.outputPath("desktop.png"), fullPage: true });
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
  await page.getByLabel("Synthetic check label").fill("mobile-smoke");
  await page.getByRole("button", { name: "Run check" }).click();
  await expect(page.getByText("Round trip complete")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("mobile.png"), fullPage: true });
});
