import { type NextFunction, type Request, type Response } from "express";

import { prisma } from "../config/prisma";
import { AppError } from "../utils/app-error";
import { createMessageSchema, getConversationMessagesQuerySchema } from "../validators/message.validator";

type ConversationParticipant = {
  id: string;
};

type MessageRecord = {
  id: string;
  conversationId: string;
  senderId: string;
  type: "TEXT" | "POST";
  text: string | null;
  postId: string | null;
  createdAt: Date;
};

type ConversationMessageRecord = {
  id: string;
  conversationId: string;
  senderId: string;
  type: "TEXT" | "POST";
  text: string | null;
  postId: string | null;
  createdAt: Date;
  sender: {
    id: string;
    username: string;
    avatar: string | null;
  };
  post: {
    id: string;
    imageUrl: string | null;
    content: string;
    author: {
      id: string;
      username: string;
      avatar: string | null;
    };
  } | null;
};

const db = prisma as unknown as {
  conversation: {
    findFirst(args: unknown): Promise<ConversationParticipant | null>;
    update(args: unknown): Promise<{ id: string; lastMessageId: string | null }>;
  };
  post: {
    findUnique(args: unknown): Promise<{ id: string } | null>;
  };
  message: {
    create(args: unknown): Promise<MessageRecord>;
    findMany(args: unknown): Promise<ConversationMessageRecord[]>;
    count(args: unknown): Promise<number>;
  };
};

let uuidValidate: ((value: string) => boolean) | null = null;

async function isValidUUID(value: unknown): Promise<boolean> {
  if (typeof value !== "string") {
    return false;
  }

  if (!uuidValidate) {
    const uuidModule = await import("uuid");
    uuidValidate = uuidModule.validate;
  }

  return uuidValidate(value);
}

export async function sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const senderId = req.user?.userId;

    if (!senderId) {
      throw new AppError("Unauthorized", 401);
    }

    const parsed = createMessageSchema.safeParse(req.body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message ?? "Invalid request";
      throw new AppError(firstIssue, 400);
    }

    const { conversationId, type, text, postId } = parsed.data;

    if (!(await isValidUUID(conversationId))) {
      throw new AppError("Invalid conversationId", 400);
    }

    const conversation = await db.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          has: senderId,
        },
      },
      select: {
        id: true,
      },
    });

    if (!conversation) {
      throw new AppError("Conversation not found", 404);
    }

    if (type === "POST") {
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
    }

    const message = await db.message.create({
      data: {
        conversationId,
        senderId,
        type,
        text: type === "TEXT" ? text!.trim() : null,
        postId: type === "POST" ? postId! : null,
      },
      select: {
        id: true,
        conversationId: true,
        senderId: true,
        type: true,
        text: true,
        postId: true,
        createdAt: true,
      },
    });

    try {
      await db.conversation.update({
        where: {
          id: conversationId,
        },
        data: {
          lastMessageId: message.id,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          lastMessageId: true,
        },
      });
    } catch (updateError) {
      console.error("Conversation update failed", {
        conversationId,
        messageId: message.id,
        error: updateError,
      });
    }

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: {
        message,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getConversationMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const currentUserId = req.user?.userId;

    if (!currentUserId) {
      throw new AppError("Unauthorized", 401);
    }

    const conversationId = req.params.conversationId;

    if (!conversationId) {
      throw new AppError("conversationId is required", 400);
    }

    if (!(await isValidUUID(conversationId))) {
      throw new AppError("Invalid conversationId", 400);
    }

    const parsedQuery = getConversationMessagesQuerySchema.safeParse(req.query);

    if (!parsedQuery.success) {
      const firstIssue = parsedQuery.error.issues[0]?.message ?? "Invalid request";
      throw new AppError(firstIssue, 400);
    }

    const { page, limit } = parsedQuery.data;
    const skip = (page - 1) * limit;

    const conversation = await db.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          has: currentUserId,
        },
      },
      select: {
        id: true,
      },
    });

    if (!conversation) {
      throw new AppError("Conversation not found", 404);
    }

    const [total, messages] = await Promise.all([
      db.message.count({
        where: {
          conversationId,
        },
      }),
      db.message.findMany({
        where: {
          conversationId,
        },
        orderBy: {
          createdAt: "asc",
        },
        skip,
        take: limit,
        select: {
          id: true,
          conversationId: true,
          senderId: true,
          type: true,
          text: true,
          postId: true,
          createdAt: true,
          sender: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
          post: {
            select: {
              id: true,
              imageUrl: true,
              content: true,
              author: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const populatedMessages = messages.map((message) => ({
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      type: message.type,
      text: message.text,
      postId: message.postId,
      createdAt: message.createdAt,
      sender: message.sender,
      post:
        message.type === "POST" && message.post
          ? {
              id: message.post.id,
              image: message.post.imageUrl,
              caption: message.post.content,
              author: message.post.author,
            }
          : null,
    }));

    res.status(200).json({
      success: true,
      data: {
        messages: populatedMessages,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: skip + messages.length < total,
          hasPreviousPage: page > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}
