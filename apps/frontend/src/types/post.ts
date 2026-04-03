export type PostAuthor = {
  id: string;
  username: string;
  avatar?: string;
};

export type Post = {
  id: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  author?: PostAuthor;
  isLiked?: boolean;
  likesCount?: number;
};

export type PostsResponse = {
  success: true;
  data: {
    posts: Post[];
  };
};

export type CreatePostResponse = {
  success: true;
  message: string;
  data: {
    post: Post;
  };
};
