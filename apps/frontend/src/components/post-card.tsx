import type { PostAuthor } from "../types/post";
import { CommentInput } from "../../components/CommentInput";
import { CommentList } from "../../components/CommentList";
import { LikeButton } from "../../components/LikeButton";

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

  return (
    <article className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <header className="flex items-center gap-3">
        {author?.avatar ? (
          <img src={author.avatar} alt={`${username} avatar`} width={32} height={32} className="rounded-full object-cover" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
            {username.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <strong className="block truncate text-sm text-slate-900">{username}</strong>
          <time dateTime={createdAt} className="text-xs text-slate-500">
            {formattedDate}
          </time>
        </div>
      </header>

      {content ? <p className="whitespace-pre-wrap break-words text-sm text-slate-800">{content}</p> : null}

      <div className="pt-1">
        <LikeButton postId={postId} isLiked={Boolean(isLiked)} likesCount={likesCount ?? 0} />
      </div>

      {imageUrl ? (
        <img src={imageUrl} alt="Post image" className="max-h-[420px] w-full rounded-lg object-cover" />
      ) : null}

      <div className="space-y-3 border-t border-slate-100 pt-3">
        <CommentInput postId={postId} />
        <CommentList postId={postId} />
      </div>
    </article>
  );
}
