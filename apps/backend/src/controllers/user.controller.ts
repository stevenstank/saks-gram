import { type NextFunction, type Request, type Response } from "express";

import { prisma } from "../config/prisma";
import { AppError } from "../utils/app-error";
import { uploadImage } from "../utils/upload-image";
import type { UpdateUserInput } from "../validation/user.validation";

type ProfileUserRecord = {
  id: string;
  username: string;
  email: string;
  bio: string | null;
  avatar: string | null;
};

const db = prisma as unknown as {
  user: {
    findUnique(args: unknown): Promise<ProfileUserRecord | null>;
    findFirst(args: unknown): Promise<ProfileUserRecord | null>;
    update(args: unknown): Promise<ProfileUserRecord>;
  };
};

const UUID_V4_OR_V1_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_V4_OR_V1_REGEX.test(value);
}

function mapProfile(user: {
  id: string;
  username: string;
  email: string;
  bio: string | null;
  avatar: string | null;
}) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    bio: user.bio ?? undefined,
    avatar: user.avatar ?? undefined,
  };
}

export async function getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const identifier = req.params.id;

    if (typeof identifier !== "string" || identifier.trim() === "") {
      throw new AppError("Invalid user identifier", 400);
    }

    const user = isUuid(identifier)
      ? await db.user.findUnique({
          where: { id: identifier },
          select: {
            id: true,
            username: true,
            email: true,
            bio: true,
            avatar: true,
          },
        })
      : await db.user.findFirst({
          where: { username: identifier },
          select: {
            id: true,
            username: true,
            email: true,
            bio: true,
            avatar: true,
          },
        });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    res.status(200).json({
      success: true,
      data: {
        user: mapProfile(user),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        bio: true,
        avatar: true,
      },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    res.status(200).json({
      success: true,
      data: {
        user: mapProfile(user),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const input = req.body as UpdateUserInput;

    const user = await db.user.update({
      where: { id: userId },
      data: {
        ...(input.bio !== undefined ? { bio: input.bio } : {}),
        ...(input.avatar !== undefined ? { avatar: input.avatar } : {}),
      },
      select: {
        id: true,
        username: true,
        email: true,
        bio: true,
        avatar: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: mapProfile(user),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function uploadAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    if (!req.file) {
      throw new AppError("Avatar file is required", 400);
    }

    const imageUrl = await uploadImage(req.file.buffer, {
      folder: "saksgram/avatars",
      publicId: userId,
    });

    res.status(200).json({
      success: true,
      message: "Avatar uploaded successfully",
      data: {
        imageUrl,
      },
    });
  } catch (error) {
    next(error);
  }
}
