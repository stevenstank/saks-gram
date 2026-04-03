import { type NextFunction, type Request, type Response } from "express";

import { prisma } from "../config/prisma";
import { AppError } from "../utils/app-error";

const db = prisma as unknown as {
  post: {
    findUnique(args: unknown): Promise<{ id: string } | null>;
  };
  like: {
    findUnique(args: unknown): Promise<{ id: string } | null>;
    create(args: unknown): Promise<{ id: string; userId: string; postId: string; createdAt: Date }>;
    delete(args: unknown): Promise<{ id: string; userId: string; postId: string; createdAt: Date }>;
  };
};

export async function toggleLike(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId;
    const postId = req.params.postId;

    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    if (typeof postId !== "string" || postId.trim() === "") {
      throw new AppError("Invalid postId", 400);
    }

    const normalizedPostId = postId.trim();

    const post = await db.post.findUnique({
      where: {
        id: normalizedPostId,
      },
      select: {
        id: true,
      },
    });

    if (!post) {
      throw new AppError("Post not found", 404);
    }

    const existingLike = await db.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId: normalizedPostId,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingLike) {
      await db.like.delete({
        where: {
          userId_postId: {
            userId,
            postId: normalizedPostId,
          },
        },
      });

      res.status(200).json({
        success: true,
        message: "Post unliked",
        data: {
          liked: false,
        },
      });
      return;
    }

    await db.like.create({
      data: {
        userId,
        postId: normalizedPostId,
      },
    });

    res.status(200).json({
      success: true,
      message: "Post liked",
      data: {
        liked: true,
      },
    });
  } catch (error) {
    next(error);
  }
}
