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

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <header className="mb-2 flex items-center gap-3">
        {comment.user.avatar ? (
          <img
            src={comment.user.avatar}
            alt={`${username} avatar`}
            className="h-8 w-8 rounded-full border border-slate-200 object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
            {username.slice(0, 1).toUpperCase()}
          </div>
        )}

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800">{username}</p>
          <time className="text-xs text-slate-500" dateTime={comment.createdAt}>
            {formattedDate}
          </time>
        </div>
      </header>

      <p className="whitespace-pre-wrap break-words text-sm text-slate-700">{comment.content}</p>
    </article>
  );
}
