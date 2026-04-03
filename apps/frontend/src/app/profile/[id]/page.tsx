"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import useSWR from "swr";

import { FollowButton } from "../../../components/follow-button";
import { PostCard } from "../../../components/post-card";
import { useAuth } from "../../../hooks/use-auth";
import { getFollowers, getFollowing, getProfile } from "../../../lib/profile-api";
import { createPost, getPostsByUser, uploadPostImage } from "../../../services/post";
import type { Post } from "../../../types/post";

type ProfileUser = {
  id: string;
  username: string;
  email: string;
  bio?: string;
  avatar?: string;
};

export default function PublicProfilePage() {
  const params = useParams<{ id: string }>();
  const username = useMemo(() => params?.id ?? "", [params]);
  const { user: authUser, isAuthenticated, isBootstrapping } = useAuth();

  const [user, setUser] = useState<ProfileUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isPostsLoading, setIsPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [postContent, setPostContent] = useState("");
  const [postImageFile, setPostImageFile] = useState<File | null>(null);
  const [postImagePreviewUrl, setPostImagePreviewUrl] = useState<string | null>(null);
  const [createPostError, setCreatePostError] = useState<string | null>(null);
  const [isCreatingPost, setIsCreatingPost] = useState(false);

  const canCreatePost = useMemo(() => {
    if (isBootstrapping || !isAuthenticated || !authUser || !user) {
      return false;
    }

    return authUser.username === user.username;
  }, [authUser, isAuthenticated, isBootstrapping, user]);

  const remainingChars = 500 - postContent.length;

  const { data: followers = [] } = useSWR(username ? `followers:${username}` : null, () => getFollowers(username));
  const { data: following = [] } = useSWR(username ? `following:${username}` : null, () => getFollowing(username));

  useEffect(() => {
    if (!username) {
      setError("Invalid profile username");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    getProfile(username)
      .then((data) => {
        setUser(data);
      })
      .catch((fetchError) => {
        const message = fetchError instanceof Error ? fetchError.message : "Failed to load profile";
        setError(message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [username]);

  useEffect(() => {
    if (!username) {
      setPosts([]);
      setPostsError("Invalid profile username");
      setIsPostsLoading(false);
      return;
    }

    setIsPostsLoading(true);
    setPostsError(null);

    getPostsByUser(username)
      .then((data) => {
        setPosts(data);
      })
      .catch((fetchError) => {
        const message = fetchError instanceof Error ? fetchError.message : "Failed to load posts";
        setPostsError(message);
      })
      .finally(() => {
        setIsPostsLoading(false);
      });
  }, [username]);

  useEffect(() => {
    if (!postImageFile) {
      if (postImagePreviewUrl) {
        URL.revokeObjectURL(postImagePreviewUrl);
        setPostImagePreviewUrl(null);
      }
      return;
    }

    const objectUrl = URL.createObjectURL(postImageFile);
    setPostImagePreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [postImageFile]);

  async function onCreatePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = postContent.trim();

    if (!trimmed && !postImageFile) {
      setCreatePostError("Add text or an image to create a post");
      return;
    }

    if (trimmed.length > 500) {
      setCreatePostError("Content must be at most 500 characters");
      return;
    }

    setIsCreatingPost(true);
    setCreatePostError(null);

    try {
      let imageUrl: string | undefined;

      if (postImageFile) {
        imageUrl = await uploadPostImage(postImageFile);
      }

      const createdPost = await createPost({
        content: trimmed,
        imageUrl,
      });

      setPosts((current) => [createdPost, ...current]);
      setPostContent("");
      setPostImageFile(null);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Failed to create post";
      setCreatePostError(message);
    } finally {
      setIsCreatingPost(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">Loading profile...</p>
        </div>
      </main>
    );
  }

  if (error || !user) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-rose-800">Profile Error</h1>
          <p className="mt-2 text-sm text-rose-700">{error ?? "User not found"}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <section className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={`${user.username} avatar`}
              className="h-20 w-20 rounded-full border border-slate-200 object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-xl font-semibold text-slate-500">
              {user.username.slice(0, 1).toUpperCase()}
            </div>
          )}

          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{user.username}</h1>
            <p className="text-sm text-slate-500">{user.email}</p>
            <div className="mt-2 flex gap-4 text-sm text-slate-700">
              <Link href={`/profile/${user.username}/followers`} className="hover:underline">
                <span className="font-semibold">{followers.length}</span> Followers
              </Link>
              <Link href={`/profile/${user.username}/following`} className="hover:underline">
                <span className="font-semibold">{following.length}</span> Following
              </Link>
            </div>
          </div>
        </div>

        <FollowButton targetUserId={user.id} targetUsername={user.username} />

        <div className="mt-6 rounded-xl bg-slate-50 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Bio</h2>
          <p className="mt-2 text-sm text-slate-700">{user.bio || "No bio added yet."}</p>
        </div>

        {canCreatePost ? (
          <form className="mt-6" onSubmit={onCreatePost}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Create Post</h2>

            <textarea
              className="mt-2 w-full rounded border border-slate-300 p-2 text-sm"
              rows={4}
              maxLength={500}
              value={postContent}
              onChange={(event) => {
                setPostContent(event.target.value);
                if (createPostError) {
                  setCreatePostError(null);
                }
              }}
              placeholder="Write a post..."
              disabled={isCreatingPost}
            />

            <div className="mt-2">
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setPostImageFile(file);
                  if (createPostError) {
                    setCreatePostError(null);
                  }
                }}
                disabled={isCreatingPost}
              />

              {postImagePreviewUrl ? (
                <div className="mt-2">
                  <img src={postImagePreviewUrl} alt="Post preview" className="max-h-64 rounded border border-slate-300" />
                  <button
                    type="button"
                    className="mt-2 rounded border border-slate-300 px-2 py-1 text-xs"
                    onClick={() => setPostImageFile(null)}
                    disabled={isCreatingPost}
                  >
                    Remove image
                  </button>
                </div>
              ) : null}
            </div>

            <p className="mt-1 text-xs text-slate-500">{remainingChars} characters left</p>

            <button
              type="submit"
              className="mt-2 rounded border border-slate-300 px-3 py-1 text-sm"
              disabled={isCreatingPost}
            >
              {isCreatingPost ? "Posting..." : "Post"}
            </button>

            {createPostError ? <p className="mt-2 text-sm text-rose-700">{createPostError}</p> : null}
          </form>
        ) : null}

        <div className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Posts</h2>

          {isPostsLoading ? <p className="mt-2 text-sm text-slate-700">Loading posts...</p> : null}

          {postsError ? <p className="mt-2 text-sm text-rose-700">{postsError}</p> : null}

          {!isPostsLoading && !postsError && posts.length === 0 ? (
            <p className="mt-2 text-sm text-slate-700">No posts yet.</p>
          ) : null}

          <div className="mt-3 space-y-3">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                content={post.content}
                author={post.author}
                createdAt={post.createdAt}
                imageUrl={post.imageUrl}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
