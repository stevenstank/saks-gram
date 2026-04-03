import type { CreatePostResponse, Post, PostsResponse } from "../types/post";
import API_URL from "../lib/api-config";

type ToggleLikeResponse = {
  success: boolean;
  message: string;
  data: {
    liked: boolean;
  };
};

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
  const response = await fetch(`${API_URL}/api/posts`, {
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

  return (body as PostsResponse).data.posts;
}

export async function getPostsByUser(username: string): Promise<Post[]> {
  const response = await fetch(`${API_URL}/api/posts/user/${encodeURIComponent(username)}`, {
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
  const response = await fetch(`${API_URL}/api/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`${API_URL}/api/upload/post`, {
    method: "POST",
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
  const response = await fetch(`${API_URL}/api/likes/${encodeURIComponent(postId)}`, {
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

  return body as ToggleLikeResponse;
}
