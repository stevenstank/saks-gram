import Link from "next/link";

type CommentUser = {
  username: string;
  avatar: string | null;
};

export type Comment = {
  id: string;
  content: string;
  createdAt: string;
  user: CommentUser;
};

type CommentItemProps = {
  comment: Comment;
};

export function CommentItem({ comment }: CommentItemProps) {
  const formattedDate = new Date(comment.createdAt).toLocaleString();
  const username = comment.user.username;
  const profileHref = `/profile/${encodeURIComponent(username)}`;

  return (
    <article className="rounded-lg border border-gray-800 bg-[#111111] p-3 shadow-sm">
      <header className="mb-2 flex items-center gap-3">
        {comment.user.avatar ? (
          <img
            src={comment.user.avatar}
            alt={`${username} avatar`}
            className="h-8 w-8 rounded-full border border-gray-800 object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-xs font-semibold text-white">
            {username.slice(0, 1).toUpperCase()}
          </div>
        )}

        <div className="min-w-0">
          <Link href={profileHref} className="block truncate text-sm font-semibold text-white hover:cursor-pointer hover:underline">
            {username}
          </Link>
          <time className="text-xs text-gray-400" dateTime={comment.createdAt}>
            {formattedDate}
          </time>
        </div>
      </header>

      <p className="whitespace-pre-wrap break-words text-sm text-gray-300">{comment.content}</p>
    </article>
  );
}
