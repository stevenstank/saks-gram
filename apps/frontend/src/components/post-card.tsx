import type { PostAuthor } from "../types/post";

type PostCardProps = {
  content: string;
  author?: Pick<PostAuthor, "username" | "avatar"> | null;
  createdAt: string;
};

export function PostCard({ content, author, createdAt }: PostCardProps) {
  const formattedDate = new Date(createdAt).toLocaleString();
  const username = author?.username || "Unknown";

  return (
    <article>
      <header>
        {author?.avatar ? <img src={author.avatar} alt={`${username} avatar`} width={32} height={32} /> : null}
        <strong>{username}</strong>
        <time dateTime={createdAt}>{formattedDate}</time>
      </header>

      <p>{content}</p>
    </article>
  );
}
