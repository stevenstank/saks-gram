import type {
  AuthMeResponse,
  AuthSuccessResponse,
  LoginInput,
  RegisterInput,
} from "../types/auth";

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

type RequestMethod = "GET" | "POST";

type RequestOptions = {
  method?: RequestMethod;
  body?: unknown;
  token?: string;
};

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const { method = "GET", body, token } = options;
  let response: Response;

  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      credentials: "include",
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

export async function apiGet<T>(path: string, token?: string): Promise<T> {
  return apiRequest<T>(path, { method: "GET", token });
}

export async function apiPost<T>(path: string, body: unknown, token?: string): Promise<T> {
  return apiRequest<T>(path, { method: "POST", body, token });
}

export async function getHealth(): Promise<HealthResponse> {
  return apiGet<HealthResponse>("/api/health");
}

export async function registerRequest(input: RegisterInput): Promise<AuthSuccessResponse> {
  return apiPost<AuthSuccessResponse>("/api/auth/register", input);
}

export async function loginRequest(input: LoginInput): Promise<AuthSuccessResponse> {
  return apiPost<AuthSuccessResponse>("/api/auth/login", input);
}

export async function getMe(token: string): Promise<AuthMeResponse> {
  return apiGet<AuthMeResponse>("/api/auth/me", token);
}
