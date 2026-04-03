import type { CreatePostResponse, Post, PostsResponse } from "../types/post";

type ToggleLikeResponse = {
  success: boolean;
  message: string;
  data: {
    liked: boolean;
  };
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
  const token = getTokenFromStorage();

  const response = await fetch(`${getApiBaseUrl()}/api/posts`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    cache: "no-store",
  });

  const body = await parseJson(response);

  if (!response.ok) {
    throw new Error(parseErrorMessage(response.status, body));
  }

  return (body as PostsResponse).data.posts;
}

export async function getPostsByUser(username: string): Promise<Post[]> {
  const token = getTokenFromStorage();

  const response = await fetch(`${getApiBaseUrl()}/api/posts/user/${encodeURIComponent(username)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    cache: "no-store",
  });

  const body = await parseJson(response);

  if (!response.ok) {
    throw new Error(parseErrorMessage(response.status, body));
  }

  return (body as PostsResponse).data.posts;
}

export async function getPostById(postId: string): Promise<Post | null> {
  const posts = await getAllPosts();
  return posts.find((post) => post.id === postId) ?? null;
}

type CreatePostInput = {
  content?: string;
  imageUrl?: string;
};

export async function createPost(input: CreatePostInput): Promise<Post> {
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
    body: JSON.stringify(input),
    credentials: "include",
    cache: "no-store",
  });

  const body = await parseJson(response);

  if (!response.ok) {
    throw new Error(parseErrorMessage(response.status, body));
  }

  return (body as CreatePostResponse).data.post;
}

export async function uploadPostImage(file: File): Promise<string> {
  const token = getTokenFromStorage();

  if (!token) {
    throw new Error("Missing authentication token");
  }

  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`${getApiBaseUrl()}/api/upload/post`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
    credentials: "include",
    cache: "no-store",
  });

  const body = await parseJson(response);

  if (!response.ok) {
    throw new Error(parseErrorMessage(response.status, body));
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("imageUrl" in body) ||
    typeof (body as { imageUrl?: unknown }).imageUrl !== "string"
  ) {
    throw new Error("Upload response is invalid");
  }

  return (body as { imageUrl: string }).imageUrl;
}

export async function togglePostLike(postId: string): Promise<ToggleLikeResponse> {
  const token = getTokenFromStorage();

  const response = await fetch(`${getApiBaseUrl()}/api/likes/${encodeURIComponent(postId)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    cache: "no-store",
  });

  const body = await parseJson(response);

  if (!response.ok) {
    throw new Error(parseErrorMessage(response.status, body));
  }

  return body as ToggleLikeResponse;
}
