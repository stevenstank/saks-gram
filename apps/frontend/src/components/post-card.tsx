import type { PostAuthor } from "../types/post";
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
    <article>
      <header>
        {author?.avatar ? <img src={author.avatar} alt={`${username} avatar`} width={32} height={32} /> : null}
        <strong>{username}</strong>
        <time dateTime={createdAt}>{formattedDate}</time>
      </header>

      {content ? <p>{content}</p> : null}

      <div style={{ marginTop: "8px" }}>
        <LikeButton postId={postId} isLiked={Boolean(isLiked)} likesCount={likesCount ?? 0} />
      </div>

      {imageUrl ? <img src={imageUrl} alt="Post image" style={{ maxHeight: "420px", borderRadius: "10px" }} /> : null}
    </article>
  );
}
