import { afterEach, describe, expect, it, vi } from "vitest";
import { checkSystem } from "./api";

const result = {
  service: "clueso-api",
  status: "ready",
  label: "synthetic-smoke",
  schemaVersion: 1,
};

afterEach(() => vi.unstubAllGlobals());

describe("diagnostic API boundary", () => {
  it("returns only a matching validated response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(result));
    vi.stubGlobal("fetch", fetchMock);
    await expect(checkSystem("synthetic-smoke")).resolves.toEqual(result);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/system/check",
      expect.objectContaining({
        method: "POST",
        body: '{"label":"synthetic-smoke"}',
      }),
    );
  });

  it.each([
    { ...result, schemaVersion: "1" },
    { ...result, label: "another-request" },
    { ...result, extra: true },
    null,
  ])("rejects an out-of-contract response: %j", async (body) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(body)));
    await expect(checkSystem("synthetic-smoke")).rejects.toThrow(
      "did not match the Phase 1 contract",
    );
  });

  it("surfaces server problem details rather than a success fallback", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ detail: "The database is not ready." }, { status: 503 }),
        ),
    );
    await expect(checkSystem("synthetic-smoke")).rejects.toThrow(
      "The database is not ready.",
    );
  });

  it("reports an invalid JSON response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("<html>not JSON</html>")),
    );
    await expect(checkSystem("synthetic-smoke")).rejects.toThrow("invalid JSON");
  });

  it("reports network failures with a recovery action", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(checkSystem("synthetic-smoke")).rejects.toThrow(
      "Cannot reach the local API",
    );
  });

  it("reports bounded request timeouts", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new DOMException("deadline exceeded", "TimeoutError")),
    );
    await expect(checkSystem("synthetic-smoke")).rejects.toThrow("timed out");
  });
});
