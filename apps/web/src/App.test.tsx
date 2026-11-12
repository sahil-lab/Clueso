import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import App from "./App";
import { checkSystem } from "./api";

vi.mock("./api", () => ({ checkSystem: vi.fn() }));

const successfulResult = {
  service: "clueso-api" as const,
  status: "ready" as const,
  label: "synthetic-smoke",
  schemaVersion: 1 as const,
};

beforeEach(() => {
  vi.mocked(checkSystem).mockReset();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("shows verification only after a successful API round trip", async () => {
  vi.mocked(checkSystem).mockResolvedValue(successfulResult);
  render(<App />);
  expect(screen.getAllByText("Not checked")).toHaveLength(2);
  fireEvent.click(screen.getByRole("button", { name: "Run check" }));
  expect(await screen.findByText("Round trip complete")).toBeTruthy();
  expect(screen.getByText("Version 1")).toBeTruthy();
  expect(screen.getAllByText("Verified")).toHaveLength(2);
  expect(checkSystem).toHaveBeenCalledWith("synthetic-smoke");
});

it("shows failures and allows an explicit retry", async () => {
  vi.mocked(checkSystem)
    .mockRejectedValueOnce(new Error("The database is not ready."))
    .mockResolvedValueOnce(successfulResult);
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Run check" }));
  expect((await screen.findByRole("alert")).textContent).toContain(
    "The database is not ready.",
  );
  expect(screen.queryByText("Round trip complete")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Run check" }));
  expect(await screen.findByText("Round trip complete")).toBeTruthy();
});

it("rejects whitespace-only labels before making a request", async () => {
  render(<App />);
  fireEvent.change(screen.getByLabelText("Synthetic check label"), {
    target: { value: "   " },
  });
  fireEvent.click(screen.getByRole("button", { name: "Run check" }));
  expect((await screen.findByRole("alert")).textContent).toContain("nonblank");
  expect(checkSystem).not.toHaveBeenCalled();
});

it("lets keyboard users explore the synthetic workflow without an API call", () => {
  render(<App />);
  const capture = screen.getByRole("tab", { name: /Capture/ });
  capture.focus();
  fireEvent.keyDown(capture, { key: "ArrowRight" });
  expect(screen.getByRole("tab", { name: /Detect/ }).getAttribute("aria-selected")).toBe(
    "true",
  );
  expect(screen.getByRole("tabpanel").textContent).toContain("not an executed diff");
  expect(document.activeElement).toBe(screen.getByRole("tab", { name: /Detect/ }));

  fireEvent.keyDown(screen.getByRole("tab", { name: /Detect/ }), { key: "End" });
  expect(screen.getByRole("tabpanel").textContent).toContain(
    "No recording or publishing",
  );
  fireEvent.keyDown(screen.getByRole("tab", { name: /Review/ }), { key: "Home" });
  expect(screen.getByRole("tab", { name: /Capture/ }).getAttribute("aria-selected")).toBe(
    "true",
  );
  expect(checkSystem).not.toHaveBeenCalled();
});

it("clears a previous result without silently rechecking the services", async () => {
  vi.mocked(checkSystem).mockResolvedValue(successfulResult);
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Run check" }));
  await screen.findByText("Round trip complete");
  fireEvent.click(screen.getByRole("button", { name: "Clear result" }));
  expect(screen.queryByText("Round trip complete")).toBeNull();
  expect(screen.getAllByText("Not checked")).toHaveLength(2);
  expect(checkSystem).toHaveBeenCalledTimes(1);
});

it("lets the user stop and resume decorative motion without making a request", () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Pause motion" }));
  expect(
    screen.getByRole("button", { name: "Resume motion" }).getAttribute("aria-pressed"),
  ).toBe("true");
  fireEvent.click(screen.getByRole("button", { name: "Resume motion" }));
  expect(
    screen.getByRole("button", { name: "Pause motion" }).getAttribute("aria-pressed"),
  ).toBe("false");
  expect(checkSystem).not.toHaveBeenCalled();
});
