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
});

afterEach(cleanup);

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
