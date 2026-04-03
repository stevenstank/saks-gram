import { type NextFunction, type Request, type Response } from "express";

import { prisma } from "../config/prisma";
import { AppError } from "../utils/app-error";

type FollowRecord = {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: Date;
};

type BasicProfile = {
  id: string;
  username: string;
  avatar: string | null;
};

type UserIdentity = {
  id: string;
  username: string;
};

const UUID_V4_OR_V1_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const db = prisma as unknown as {
  user: {
    findUnique(args: unknown): Promise<UserIdentity | null>;
    findFirst(args: unknown): Promise<UserIdentity | null>;
  };
  follow: {
    findUnique(args: unknown): Promise<{ id: string } | null>;
    create(args: unknown): Promise<FollowRecord>;
    deleteMany(args: unknown): Promise<{ count: number }>;
    findFirst(args: unknown): Promise<{ id: string } | null>;
    findMany(args: unknown): Promise<Array<{ follower: BasicProfile } | { following: BasicProfile }>>;
  };
};

function getTargetUserId(param: unknown): string {
  if (typeof param !== "string" || param.trim() === "") {
    throw new AppError("Invalid target user identifier", 400);
  }

  return param;
}

function isUuid(value: string): boolean {
  return UUID_V4_OR_V1_REGEX.test(value);
}

async function resolveUserIdentity(identifier: string): Promise<UserIdentity> {
  const user = isUuid(identifier)
    ? await db.user.findUnique({
        where: {
          id: identifier,
        },
        select: {
          id: true,
          username: true,
        },
      })
    : await db.user.findFirst({
        where: {
          username: identifier,
        },
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

export async function followUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const followerId = req.user?.userId;

    if (!followerId) {
      throw new AppError("Unauthorized", 401);
    }

    const targetUserIdentifier = getTargetUserId(req.params.userId);
    const targetUser = await resolveUserIdentity(targetUserIdentifier);
    const targetUserId = targetUser.id;

    if (followerId === targetUserId) {
      throw new AppError("You cannot follow yourself", 400);
    }

    const existingFollow = await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: targetUserId,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingFollow) {
      throw new AppError("You are already following this user", 409);
    }

    const follow = await db.follow.create({
      data: {
        followerId,
        followingId: targetUserId,
      },
      select: {
        id: true,
        followerId: true,
        followingId: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "User followed successfully",
      data: {
        follow,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function unfollowUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const followerId = req.user?.userId;

    if (!followerId) {
      throw new AppError("Unauthorized", 401);
    }

    const targetUserIdentifier = getTargetUserId(req.params.userId);
    const targetUser = await resolveUserIdentity(targetUserIdentifier);
    const targetUserId = targetUser.id;

    if (followerId === targetUserId) {
      throw new AppError("You cannot unfollow yourself", 400);
    }

    const deleted = await db.follow.deleteMany({
      where: {
        followerId,
        followingId: targetUserId,
      },
    });

    if (deleted.count === 0) {
      throw new AppError("Follow relationship not found", 404);
    }

    res.status(200).json({
      success: true,
      message: "User unfollowed successfully",
    });
  } catch (error) {
    next(error);
  }
}

export async function getFollowStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const followerId = req.user?.userId;

    if (!followerId) {
      throw new AppError("Unauthorized", 401);
    }

    const targetUserIdentifier = getTargetUserId(req.params.userId);
    const targetUser = await resolveUserIdentity(targetUserIdentifier);
    const targetUserId = targetUser.id;

    if (followerId === targetUserId) {
      res.status(200).json({
        success: true,
        data: {
          isFollowing: false,
        },
      });
      return;
    }

    const follow = await db.follow.findFirst({
      where: {
        followerId,
        followingId: targetUserId,
      },
      select: {
        id: true,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        isFollowing: Boolean(follow),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getFollowersByUserId(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userIdentifier = getTargetUserId(req.params.userId);
    const user = await resolveUserIdentity(userIdentifier);

    const followRows = (await db.follow.findMany({
      where: {
        followingId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        follower: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    })) as Array<{ follower: BasicProfile }>;

    const followers = followRows.map((row) => row.follower);

    res.status(200).json({
      success: true,
      data: {
        followers,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getFollowingByUserId(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userIdentifier = getTargetUserId(req.params.userId);
    const user = await resolveUserIdentity(userIdentifier);

    const followRows = (await db.follow.findMany({
      where: {
        followerId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        following: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    })) as Array<{ following: BasicProfile }>;

    const following = followRows.map((row) => row.following);

    res.status(200).json({
      success: true,
      data: {
        following,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyFollowing(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const currentUserId = req.user?.userId;

    if (!currentUserId) {
      throw new AppError("Unauthorized", 401);
    }

    const followRows = (await db.follow.findMany({
      where: {
        followerId: currentUserId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        following: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    })) as Array<{ following: BasicProfile }>;

    const following = followRows.map((row) => row.following);

    res.status(200).json({
      success: true,
      data: {
        following,
      },
    });
  } catch (error) {
    next(error);
  }
}
