import type { AuthUser } from "../types/auth";
import API_URL from "./api-config";

type ApiSuccess<T> = {
  success: true;
  message?: string;
  data: T;
};

type ProfileUser = Pick<AuthUser, "id" | "username" | "email" | "bio" | "avatar">;
export type DiscoverUser = Pick<AuthUser, "id" | "username" | "avatar">;

export type BasicFollowUser = {
  id: string;
  username: string;
  avatar?: string;
};

type UpdateProfileInput = {
  bio?: string | null;
  avatar?: string | null;
};

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

export async function getProfile(id: string): Promise<ProfileUser> {
  const response = await fetch(`${API_URL}/api/users/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    cache: "no-store",
  });

  const body = await parseJson(response);

  if (!response.ok) {
    throw new Error(parseErrorMessage(response.status, body));
  }

  return (body as ApiSuccess<{ user: ProfileUser }>).data.user;
}

export async function getCurrentUser(): Promise<ProfileUser> {
  const response = await fetch(`${API_URL}/api/users/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    cache: "no-store",
  });

  const body = await parseJson(response);

  if (!response.ok) {
    throw new Error(parseErrorMessage(response.status, body));
  }

  return (body as ApiSuccess<{ user: ProfileUser }>).data.user;
}

export async function updateProfile(data: UpdateProfileInput): Promise<ProfileUser> {
  const response = await fetch(`${API_URL}/api/users/update`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
    credentials: "include",
    cache: "no-store",
  });

  const body = await parseJson(response);

  if (!response.ok) {
    throw new Error(parseErrorMessage(response.status, body));
  }

  return (body as ApiSuccess<{ user: ProfileUser }>).data.user;
}

export async function uploadAvatar(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("avatar", file);

  const response = await fetch(`${API_URL}/api/users/upload-avatar`, {
    method: "POST",
    body: formData,
    credentials: "include",
    cache: "no-store",
  });

  const body = await parseJson(response);

  if (!response.ok) {
    throw new Error(parseErrorMessage(response.status, body));
  }

  return (body as ApiSuccess<{ imageUrl: string }>).data.imageUrl;
}

export async function getFollowStatus(userId: string): Promise<boolean> {
  const response = await fetch(`${API_URL}/api/follow/status/${userId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    cache: "no-store",
  });

  const body = await parseJson(response);

  if (!response.ok) {
    throw new Error(parseErrorMessage(response.status, body));
  }

  return (body as ApiSuccess<{ isFollowing: boolean }>).data.isFollowing;
}

export async function followUser(userId: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/follow/${userId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    cache: "no-store",
  });

  const body = await parseJson(response);

  if (!response.ok) {
    throw new Error(parseErrorMessage(response.status, body));
  }
}

export async function unfollowUser(userId: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/follow/${userId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    cache: "no-store",
  });

  const body = await parseJson(response);

  if (!response.ok) {
    throw new Error(parseErrorMessage(response.status, body));
  }
}

export async function getFollowers(userId: string): Promise<BasicFollowUser[]> {
  const response = await fetch(`${API_URL}/api/users/${userId}/followers`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    cache: "no-store",
  });

  const body = await parseJson(response);

  if (!response.ok) {
    throw new Error(parseErrorMessage(response.status, body));
  }

  return (body as ApiSuccess<{ followers: BasicFollowUser[] }>).data.followers;
}

export async function getFollowing(userId: string): Promise<BasicFollowUser[]> {
  const response = await fetch(`${API_URL}/api/users/${userId}/following`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    cache: "no-store",
  });

  const body = await parseJson(response);

  if (!response.ok) {
    throw new Error(parseErrorMessage(response.status, body));
  }

  return (body as ApiSuccess<{ following: BasicFollowUser[] }>).data.following;
}

export async function getMyFollowing(): Promise<BasicFollowUser[]> {
  const response = await fetch(`${API_URL}/api/users/following`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    cache: "no-store",
  });

  const body = await parseJson(response);

  if (!response.ok) {
    throw new Error(parseErrorMessage(response.status, body));
  }

  return (body as ApiSuccess<{ following: BasicFollowUser[] }>).data.following;
}

export async function getAllUsers(): Promise<DiscoverUser[]> {
  const response = await fetch(`${API_URL}/api/users`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    cache: "no-store",
  });

  const body = await parseJson(response);

  if (!response.ok) {
    throw new Error(parseErrorMessage(response.status, body));
  }

  return (body as ApiSuccess<{ users: DiscoverUser[] }>).data.users;
}
