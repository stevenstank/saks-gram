import { type Request, type Response } from "express";

import { prisma } from "../config/prisma";
import { AppError } from "../utils/app-error";

type FeedPost = {
  id: string;
  content: string;
  imageUrl: string | null;
  createdAt: Date;
  likes: Array<{ id: string }>;
  author: {
    username: string;
    avatar: string | null;
  };
  _count: {
    likes: number;
    comments: number;
  };
};

const db = prisma as unknown as {
  follow: {
    findMany(args: unknown): Promise<Array<{ followingId: string }>>;
  };
  post: {
    findMany(args: unknown): Promise<FeedPost[]>;
  };
};

function toPositiveInt(value: unknown, fallback: number): number {
  if (typeof value !== "string") {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export async function getFeed(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    console.log("Feed userId:", userId);

    const page = toPositiveInt(req.query.page, 1);
    const limit = toPositiveInt(req.query.limit, 10);
    const skip = (page - 1) * limit;

    const following = await db.follow.findMany({
      where: {
        followerId: userId,
      },
      select: {
        followingId: true,
      },
    });

    const followingIds = following.map((f) => f.followingId);

    if (!followingIds.includes(userId)) {
      followingIds.push(userId);
    }

    console.log("Feed followingIds:", followingIds);

    const posts = await db.post.findMany({
      where: {
        authorId: {
          in: followingIds,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        likes: {
          where: {
            userId,
          },
          select: {
            id: true,
          },
        },
        author: {
          select: {
            username: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      take: limit,
      skip,
    });

    const cleanedPosts = posts.map((post) => ({
      id: post.id,
      content: post.content,
      image: post.imageUrl,
      createdAt: post.createdAt,
      author: {
        username: post.author.username,
        avatar: post.author.avatar,
      },
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      isLiked: post.likes.length > 0,
    }));

    const hasMore = posts.length === limit;

    res.status(200).json({
      posts: cleanedPosts,
      hasMore,
    });
  } catch (error) {
    if (error instanceof AppError) {
      console.error("Feed API error:", error.message);
      res.status(error.statusCode).json({
        message: error.message,
      });
      return;
    }

    console.error("Feed API unexpected error:", error);
    res.status(500).json({
      message: "Failed to fetch feed",
    });
  }
}
