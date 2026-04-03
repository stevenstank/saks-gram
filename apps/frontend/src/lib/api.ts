import type {
  AuthMeResponse,
  AuthSuccessResponse,
  LoginInput,
  RegisterInput,
} from "../types/auth";
import API_URL from "./api-config";

export type HealthResponse = {
  success: boolean;
  message: string;
};

type RequestMethod = "GET" | "POST" | "DELETE";

type RequestOptions = {
  method?: RequestMethod;
  body?: unknown;
};

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body } = options;
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
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

export async function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: "GET" });
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, { method: "POST", body });
}

export async function apiDelete<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: "DELETE" });
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

export async function getMe(): Promise<AuthMeResponse> {
  return apiGet<AuthMeResponse>("/api/auth/me");
}

export async function logoutRequest(): Promise<{ success: boolean; message: string }> {
  return apiPost<{ success: boolean; message: string }>("/api/auth/logout", {});
}
