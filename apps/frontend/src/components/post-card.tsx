import type { PostAuthor } from "../types/post";

type PostCardProps = {
  content: string;
  author?: Pick<PostAuthor, "username" | "avatar"> | null;
  createdAt: string;
  imageUrl?: string;
};

export function PostCard({ content, author, createdAt, imageUrl }: PostCardProps) {
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
      {imageUrl ? <img src={imageUrl} alt="Post image" style={{ maxHeight: "420px", borderRadius: "10px" }} /> : null}
    </article>
  );
}
