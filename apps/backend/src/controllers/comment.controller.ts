import { type NextFunction, type Request, type Response } from "express";
import { z } from "zod";

import { prisma } from "../config/prisma";
import { AppError } from "../utils/app-error";
import { createCommentSchema } from "../validators/comment.validator";

const db = prisma as unknown as {
  post: {
    findUnique(args: unknown): Promise<{ id: string } | null>;
  };
  comment: {
    findUnique(args: unknown): Promise<{
      id: string;
      userId: string;
    } | null>;
    create(args: unknown): Promise<{
      id: string;
      content: string;
      createdAt: Date;
      updatedAt: Date;
      userId: string;
      postId: string;
      user: {
        username: string;
        avatar: string | null;
      };
    }>;
    findMany(args: unknown): Promise<
      Array<{
        id: string;
        content: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        postId: string;
        user: {
          username: string;
          avatar: string | null;
        };
      }>
    >;
    delete(args: unknown): Promise<{ id: string }>;
  };
};

export async function createComment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const postIdFromParams = req.params.postId ?? req.params.id;
    const postIdFromBody = (req.body as { postId?: unknown })?.postId;

    const parsed = createCommentSchema.safeParse({
      content: (req.body as { content?: unknown })?.content,
      postId: postIdFromParams ?? postIdFromBody,
    });

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message ?? "Invalid request";
      throw new AppError(firstIssue, 400);
    }

    const { content, postId } = parsed.data;

    const post = await db.post.findUnique({
      where: {
        id: postId,
      },
      select: {
        id: true,
      },
    });

    if (!post) {
      throw new AppError("Post not found", 404);
    }

    const comment = await db.comment.create({
      data: {
        content,
        userId,
        postId,
      },
      include: {
        user: {
          select: {
            username: true,
            avatar: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Comment created successfully",
      data: {
        comment,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstIssue = error.issues[0]?.message ?? "Invalid request";
      next(new AppError(firstIssue, 400));
      return;
    }

    next(error);
  }
}

export async function getCommentsByPost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const postId = req.params.postId ?? req.params.id;

    if (typeof postId !== "string" || postId.trim() === "") {
      throw new AppError("postId is required", 400);
    }

    const comments = await db.comment.findMany({
      where: {
        postId,
      },
      include: {
        user: {
          select: {
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      success: true,
      data: {
        comments,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteComment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const requestUserId = req.user?.userId ?? (req.user as { id?: string } | undefined)?.id;

    if (!requestUserId) {
      throw new AppError("Unauthorized", 401);
    }

    const commentId = req.params.id ?? req.params.commentId;

    if (typeof commentId !== "string" || commentId.trim() === "") {
      throw new AppError("commentId is required", 400);
    }

    const comment = await db.comment.findUnique({
      where: {
        id: commentId,
      },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!comment) {
      throw new AppError("Comment not found", 404);
    }

    if (comment.userId !== requestUserId) {
      throw new AppError("Unauthorized", 401);
    }

    await db.comment.delete({
      where: {
        id: commentId,
      },
      select: {
        id: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}
