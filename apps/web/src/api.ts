export interface SystemCheckResponse {
  service: "clueso-api";
  status: "ready";
  label: string;
  schemaVersion: 1;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSystemCheck(value: unknown): value is SystemCheckResponse {
  return (
    isRecord(value) &&
    Object.keys(value).length === 4 &&
    value.service === "clueso-api" &&
    value.status === "ready" &&
    typeof value.label === "string" &&
    value.schemaVersion === 1
  );
}

export async function checkSystem(label: string): Promise<SystemCheckResponse> {
  let response: Response;
  try {
    response = await fetch("/api/v1/system/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
      signal: AbortSignal.timeout(8_000),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new Error("The check timed out. Verify the local stack and try again.", {
        cause: error,
      });
    }
    if (error instanceof TypeError) {
      throw new Error("Cannot reach the local API. Check the stack and try again.", {
        cause: error,
      });
    }
    throw error;
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("The API returned invalid JSON. Check the local service logs.", {
        cause: error,
      });
    }
    throw error;
  }

  if (!response.ok) {
    if (isRecord(body) && typeof body.detail === "string") {
      throw new Error(body.detail);
    }
    throw new Error(`The API returned HTTP ${response.status}. Check the local stack.`);
  }

  if (!isSystemCheck(body) || body.label !== label) {
    throw new Error("The API response did not match the Phase 1 contract.");
  }
  return body;
}
