import { type NextFunction, type Request, type Response } from "express";

import { prisma } from "../config/prisma";
import { AppError } from "../utils/app-error";

type UserIdentity = {
  id: string;
  username: string;
};

type ConversationRecord = {
  id: string;
  participants: string[];
  participantsKey: string;
  lastMessageId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type UserProfile = {
  id: string;
  username: string;
  avatar: string | null;
};

type ConversationListRecord = {
  id: string;
  participants: string[];
  updatedAt: Date;
  messages: Array<{
    id: string;
    senderId: string;
    type: "TEXT" | "POST";
    text: string | null;
    postId: string | null;
    createdAt: Date;
  }>;
};

type ConversationDelegate = {
  upsert(args: {
    where: { participantsKey: string };
    update: Record<string, never>;
    create: { participants: string[]; participantsKey: string };
    select: {
      id: true;
      participants: true;
      lastMessageId: true;
      createdAt: true;
      updatedAt: true;
    };
  }): Promise<ConversationRecord>;
  findMany(args: {
    where: { participants: { has: string } };
    orderBy: { updatedAt: "desc" };
    select: {
      id: true;
      participants: true;
      updatedAt: true;
      messages: {
        orderBy: { createdAt: "desc" };
        take: number;
        select: {
          id: true;
          senderId: true;
          type: true;
          text: true;
          postId: true;
          createdAt: true;
        };
      };
    };
  }): Promise<ConversationListRecord[]>;
};

const UUID_V4_OR_V1_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_V4_OR_V1_REGEX.test(value);
}

function getTargetUserIdentifier(param: unknown): string {
  if (typeof param !== "string" || param.trim() === "") {
    throw new AppError("Invalid target user identifier", 400);
  }

  return param.trim();
}

async function resolveUserIdentity(identifier: string): Promise<UserIdentity> {
  const user = isUuid(identifier)
    ? await prisma.user.findUnique({
        where: { id: identifier },
        select: {
          id: true,
          username: true,
        },
      })
    : await prisma.user.findFirst({
        where: { username: identifier },
        select: {
          id: true,
          username: true,
        },
      });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
}

function buildParticipantsKey(userAId: string, userBId: string): { participants: string[]; participantsKey: string } {
  const participants = [userAId, userBId].sort();
  return {
    participants,
    participantsKey: participants.join(":"),
  };
}

function getConversationDelegate(): ConversationDelegate | null {
  const candidate = (prisma as unknown as { conversation?: unknown }).conversation;

  if (
    candidate &&
    typeof candidate === "object" &&
    "findMany" in candidate &&
    typeof (candidate as { findMany: unknown }).findMany === "function" &&
    "upsert" in candidate &&
    typeof (candidate as { upsert: unknown }).upsert === "function"
  ) {
    return candidate as ConversationDelegate;
  }

  return null;
}

export async function startConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const currentUserId = req.user?.userId;

    if (!currentUserId) {
      throw new AppError("Unauthorized", 401);
    }

    const targetFromBody =
      typeof req.body === "object" &&
      req.body !== null &&
      "targetUserId" in req.body &&
      typeof (req.body as { targetUserId?: unknown }).targetUserId === "string"
        ? (req.body as { targetUserId: string }).targetUserId
        : undefined;

    const targetIdentifier = getTargetUserIdentifier(req.params.userId ?? targetFromBody);
    const targetUser = await resolveUserIdentity(targetIdentifier);

    if (targetUser.id === currentUserId) {
      throw new AppError("You cannot start a conversation with yourself", 400);
    }

    const { participants, participantsKey } = buildParticipantsKey(currentUserId, targetUser.id);

    const conversationDelegate = getConversationDelegate();

    if (!conversationDelegate) {
      throw new AppError("Conversations service unavailable", 500);
    }

    const conversation = await conversationDelegate.upsert({
      where: {
        participantsKey,
      },
      update: {},
      create: {
        participants,
        participantsKey,
      },
      select: {
        id: true,
        participants: true,
        lastMessageId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        conversation,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyConversations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const currentUserId = req.user?.userId;

    if (!currentUserId) {
      throw new AppError("Unauthorized", 401);
    }

    const conversationDelegate = getConversationDelegate();

    if (!conversationDelegate) {
      console.error("Conversation delegate unavailable", {
        hasUser: Boolean(prisma.user),
      });
      throw new AppError("Conversations service unavailable", 500);
    }

    const conversations = await conversationDelegate.findMany({
      where: {
        participants: {
          has: currentUserId,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        participants: true,
        updatedAt: true,
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            id: true,
            senderId: true,
            type: true,
            text: true,
            postId: true,
            createdAt: true,
          },
        },
      },
    });

    const otherParticipantIds = Array.from(
      new Set(
        conversations
          .flatMap((conversation: ConversationListRecord) =>
            conversation.participants.filter((participantId: string) => participantId !== currentUserId),
          )
          .filter(Boolean),
      ),
    );

    const participants =
      otherParticipantIds.length > 0
        ? await prisma.user.findMany({
            where: {
              id: {
                in: otherParticipantIds as string[],
              },
            },
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          })
        : [];

    const participantLookup = new Map(participants.map((participant) => [participant.id, participant]));

    const items = conversations.map((conversation: ConversationListRecord) => ({
      id: conversation.id,
      participants: conversation.participants
        .filter((participantId: string) => participantId !== currentUserId)
        .map((participantId: string) => participantLookup.get(participantId))
        .filter((participant: UserProfile | undefined): participant is UserProfile => participant !== undefined),
      lastMessage: conversation.messages[0] ?? null,
      updatedAt: conversation.updatedAt,
    }));

    res.status(200).json({
      success: true,
      data: {
        conversations: items,
      },
    });
  } catch (error) {
    console.error("getMyConversations failed", {
      userId: req.user?.userId,
      hasConversationDelegate: Boolean(getConversationDelegate()),
      error,
    });
    next(error);
  }
}
