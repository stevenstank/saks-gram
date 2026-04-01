export type HealthResponse = {
  success: boolean;
  message: string;
};

function getApiBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!baseUrl || baseUrl.trim() === "") {
    throw new Error("Missing NEXT_PUBLIC_API_BASE_URL");
  }

  return baseUrl.replace(/\/$/, "");
}

export async function apiGet<T>(path: string): Promise<T> {
  const baseUrl = getApiBaseUrl();
  let response: Response;

  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
  } catch {
    throw new Error("Network error while calling API");
  }

  const rawBody = await response.text();
  let parsedBody: unknown = null;

  if (rawBody) {
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      throw new Error("API returned invalid JSON");
    }
  }

  if (!response.ok) {
    const message =
      typeof parsedBody === "object" &&
      parsedBody !== null &&
      "message" in parsedBody &&
      typeof (parsedBody as { message?: unknown }).message === "string"
        ? (parsedBody as { message: string }).message
        : `API request failed with status ${response.status}`;

    throw new Error(message);
  }

  return parsedBody as T;
}

export async function getHealth(): Promise<HealthResponse> {
  return apiGet<HealthResponse>("/api/health");
}
