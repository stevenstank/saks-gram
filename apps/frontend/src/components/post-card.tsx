"use client";

import { useState } from "react";
import Link from "next/link";

import type { PostAuthor } from "../types/post";
import { CommentInput } from "../../components/CommentInput";
import { CommentList } from "../../components/CommentList";
import { LikeButton } from "../../components/LikeButton";
import { Avatar } from "./ui/avatar";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { SharePostModal } from "./share-post-modal";

type PostCardProps = {
  postId: string;
  content: string;
  author?: Pick<PostAuthor, "username" | "avatar"> | null;
  createdAt: string;
  imageUrl?: string;
  isLiked?: boolean;
  likesCount?: number;
};

export function PostCard({ postId, content, author, createdAt, imageUrl, isLiked, likesCount }: PostCardProps) {
  const formattedDate = new Date(createdAt).toLocaleString();
  const username = author?.username || "Unknown";
  const profileHref = username !== "Unknown" ? `/profile/${encodeURIComponent(username)}` : "/profile";
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  return (
    <Card className="space-y-4 border-gray-800 bg-[#111111] p-4 shadow-md">
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar src={author?.avatar ?? null} alt={`${username} avatar`} name={username} size="md" />
          <div className="min-w-0">
            <Link href={profileHref} className="block truncate text-sm font-semibold text-white hover:cursor-pointer hover:underline">
              {username}
            </Link>
            <time dateTime={createdAt} className="text-xs text-gray-400">
              {formattedDate}
            </time>
          </div>
        </div>
      </header>

      <div className="space-y-3">
        {content ? <p className="whitespace-pre-wrap break-words text-sm leading-6 text-white">{content}</p> : null}

        {imageUrl ? <img src={imageUrl} alt="Post image" className="max-h-[420px] w-full rounded-2xl object-cover" /> : null}
      </div>

      <footer className="flex flex-wrap items-center gap-3 border-t border-gray-800 pt-3">
        <LikeButton postId={postId} isLiked={Boolean(isLiked)} likesCount={likesCount ?? 0} />
        <Button type="button" variant="ghost" className="text-gray-300">
          💬 Comment
        </Button>
        <Button
          type="button"
          variant="ghost"
          aria-label="Share post"
          title="Share"
          onClick={() => setIsShareModalOpen(true)}
          className="h-10 w-10 rounded-full px-0 text-gray-300"
        >
          ↗
        </Button>
        <Link href={profileHref}>
          <Button type="button" variant="ghost" className="text-gray-300">
            View
          </Button>
        </Link>
      </footer>

      <div className="space-y-3 border-t border-gray-800 pt-3">
        <CommentInput postId={postId} />
        <CommentList postId={postId} />
      </div>

      <SharePostModal isOpen={isShareModalOpen} postId={postId} onClose={() => setIsShareModalOpen(false)} />
    </Card>
  );
}
