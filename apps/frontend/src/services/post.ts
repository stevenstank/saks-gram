import type { CreatePostResponse, Post, PostsResponse } from "../types/post";

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

export async function getAllPosts(): Promise<Post[]> {
  const response = await fetch(`${getApiBaseUrl()}/api/posts`, {
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

  return (body as PostsResponse).data.posts;
}

export async function getPostsByUser(username: string): Promise<Post[]> {
  const response = await fetch(`${getApiBaseUrl()}/api/posts/user/${encodeURIComponent(username)}`, {
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

  return (body as PostsResponse).data.posts;
}

export async function createPost(content: string): Promise<Post> {
  const token = getTokenFromStorage();

  if (!token) {
    throw new Error("Missing authentication token");
  }

  const response = await fetch(`${getApiBaseUrl()}/api/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
    cache: "no-store",
  });

  const body = await parseJson(response);

  if (!response.ok) {
    throw new Error(parseErrorMessage(response.status, body));
  }

  return (body as CreatePostResponse).data.post;
}
