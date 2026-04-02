import type { AuthUser } from "../types/auth";

type ApiSuccess<T> = {
  success: true;
  message?: string;
  data: T;
};

type ProfileUser = Pick<AuthUser, "id" | "username" | "email" | "bio" | "avatar">;

export type BasicFollowUser = {
  id: string;
  username: string;
  avatar?: string;
};

type UpdateProfileInput = {
  bio?: string | null;
  avatar?: string | null;
};

function getApiBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!baseUrl || baseUrl.trim() === "") {
    throw new Error("Missing NEXT_PUBLIC_API_BASE_URL");
  }

  return baseUrl.replace(/\/$/, "");
}

function getTokenFromStorage(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("saksgram.auth.token");
}

function parseErrorMessage(status: number, body: unknown): string {
  if (
    typeof body === "object" &&
    body !== null &&
    "message" in body &&
    typeof (body as { message?: unknown }).message === "string"
  ) {
    return (body as { message: string }).message;
  }

  return `API request failed with status ${status}`;
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("API returned invalid JSON");
  }
}

function getAuthHeader(token?: string): Record<string, string> {
  const resolvedToken = token ?? getTokenFromStorage();

  if (!resolvedToken) {
    throw new Error("Missing authentication token");
  }

  return {
    Authorization: `Bearer ${resolvedToken}`,
  };
}

export async function getProfile(id: string): Promise<ProfileUser> {
  const maybeToken = getTokenFromStorage();

  const response = await fetch(`${getApiBaseUrl()}/api/users/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(maybeToken ? { Authorization: `Bearer ${maybeToken}` } : {}),
    },
    cache: "no-store",
  });

  const body = await parseJson(response);

  if (!response.ok) {
    throw new Error(parseErrorMessage(response.status, body));
  }

  return (body as ApiSuccess<{ user: ProfileUser }>).data.user;
}

export async function getCurrentUser(token?: string): Promise<ProfileUser> {
  const response = await fetch(`${getApiBaseUrl()}/api/users/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(token),
    },
    cache: "no-store",
  });

  const body = await parseJson(response);

  if (!response.ok) {
    throw new Error(parseErrorMessage(response.status, body));
  }

  return (body as ApiSuccess<{ user: ProfileUser }>).data.user;
}

export async function updateProfile(data: UpdateProfileInput, token?: string): Promise<ProfileUser> {
  const response = await fetch(`${getApiBaseUrl()}/api/users/update`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(token),
    },
    body: JSON.stringify(data),
    cache: "no-store",
  });

  const body = await parseJson(response);

  if (!response.ok) {
    throw new Error(parseErrorMessage(response.status, body));
  }

  return (body as ApiSuccess<{ user: ProfileUser }>).data.user;
}

export async function uploadAvatar(file: File, token?: string): Promise<string> {
  const formData = new FormData();
  formData.append("avatar", file);

  const response = await fetch(`${getApiBaseUrl()}/api/users/upload-avatar`, {
    method: "POST",
    headers: {
      ...getAuthHeader(token),
    },
    body: formData,
    cache: "no-store",
  });

  const body = await parseJson(response);

  if (!response.ok) {
    throw new Error(parseErrorMessage(response.status, body));
  }

  return (body as ApiSuccess<{ imageUrl: string }>).data.imageUrl;
}

export async function getFollowStatus(userId: string, token?: string): Promise<boolean> {
  const response = await fetch(`${getApiBaseUrl()}/api/follow/status/${userId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(token),
    },
    cache: "no-store",
  });

  const body = await parseJson(response);

  if (!response.ok) {
    throw new Error(parseErrorMessage(response.status, body));
  }

  return (body as ApiSuccess<{ isFollowing: boolean }>).data.isFollowing;
}

export async function followUser(userId: string, token?: string): Promise<void> {
  const response = await fetch(`${getApiBaseUrl()}/api/follow/${userId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(token),
    },
    cache: "no-store",
  });

  const body = await parseJson(response);

  if (!response.ok) {
    throw new Error(parseErrorMessage(response.status, body));
  }
}

export async function unfollowUser(userId: string, token?: string): Promise<void> {
  const response = await fetch(`${getApiBaseUrl()}/api/follow/${userId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(token),
    },
    cache: "no-store",
  });

  const body = await parseJson(response);

  if (!response.ok) {
    throw new Error(parseErrorMessage(response.status, body));
  }
}

export async function getFollowers(userId: string): Promise<BasicFollowUser[]> {
  const response = await fetch(`${getApiBaseUrl()}/api/users/${userId}/followers`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const body = await parseJson(response);

  if (!response.ok) {
    throw new Error(parseErrorMessage(response.status, body));
  }

  return (body as ApiSuccess<{ followers: BasicFollowUser[] }>).data.followers;
}

export async function getFollowing(userId: string): Promise<BasicFollowUser[]> {
  const response = await fetch(`${getApiBaseUrl()}/api/users/${userId}/following`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const body = await parseJson(response);

  if (!response.ok) {
    throw new Error(parseErrorMessage(response.status, body));
  }

  return (body as ApiSuccess<{ following: BasicFollowUser[] }>).data.following;
}
