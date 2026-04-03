export type PostAuthor = {
  id: string;
  username: string;
  avatar?: string;
};

export type Post = {
  id: string;
  content: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author: PostAuthor;
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
