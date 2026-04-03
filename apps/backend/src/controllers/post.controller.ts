import { type NextFunction, type Request, type Response } from "express";

import { prisma } from "../config/prisma";
import { AppError } from "../utils/app-error";

type PostWithAuthorRecord = {
  id: string;
  content: string;
  imageUrl: string | null;
  createdAt: Date;
  author: {
    id: string;
    username: string;
    avatar: string | null;
  };
};

const db = prisma as unknown as {
  user: {
    findUnique(args: unknown): Promise<{ id: string; username: string } | null>;
  };
  post: {
    create(args: unknown): Promise<PostWithAuthorRecord>;
    findMany(args: unknown): Promise<PostWithAuthorRecord[]>;
  };
};

export async function createPost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const payload = req.body as {
      content?: unknown;
      imageUrl?: unknown;
    };

    if (payload.content !== undefined && typeof payload.content !== "string") {
      throw new AppError("Content must be a string", 400);
    }

    if (payload.imageUrl !== undefined && typeof payload.imageUrl !== "string") {
      throw new AppError("imageUrl must be a string", 400);
    }

    const content = (payload.content ?? "").trim();
    const imageUrl = (payload.imageUrl ?? "").trim();

    if (!content && !imageUrl) {
      throw new AppError("At least content or imageUrl is required", 400);
    }

    if (content.length > 500) {
      throw new AppError("Content must be at most 500 characters", 400);
    }

    const post = await db.post.create({
      data: {
        content,
        imageUrl: imageUrl || null,
        authorId: userId,
      },
      select: {
        id: true,
        content: true,
        imageUrl: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: {
        post,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getAllPosts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const posts = await db.post.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        content: true,
        imageUrl: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        posts,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getPostsByUsername(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const usernameParam = req.params.username;

    if (typeof usernameParam !== "string" || usernameParam.trim() === "") {
      throw new AppError("Invalid username", 400);
    }

    const username = usernameParam.trim();

    const user = await db.user.findUnique({
      where: {
        username,
      },
      select: {
        id: true,
        username: true,
      },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const posts = await db.post.findMany({
      where: {
        authorId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        content: true,
        imageUrl: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        posts,
      },
    });
  } catch (error) {
    next(error);
  }
}
