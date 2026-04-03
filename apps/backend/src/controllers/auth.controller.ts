import { type Request, type Response, type NextFunction } from "express";

import { getEnv } from "../config/env";
import { prisma } from "../config/prisma";
import type { LoginInput, RegisterInput } from "../types/auth";
import { AppError } from "../utils/app-error";
import { generateToken } from "../utils/jwt";
import { comparePassword, hashPassword } from "../utils/password";

type AuthUserRecord = {
  id: string;
  username: string;
  email: string;
  password: string;
  bio: string | null;
  avatar: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const db = prisma as unknown as {
  user: {
    findFirst(args: unknown): Promise<{ id: string } | null>;
    create(args: unknown): Promise<Omit<AuthUserRecord, "password">>;
    findUnique(args: unknown): Promise<AuthUserRecord | null>;
  };
};

const AUTH_COOKIE_NAME = "saksgram.token";

function getAuthCookieOptions(): {
  httpOnly: true;
  sameSite: "none";
  secure: boolean;
  path: "/";
  maxAge: number;
} {
  const { NODE_ENV } = getEnv();

  return {
    httpOnly: true,
    sameSite: "none",
    secure: NODE_ENV === "production",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = req.body as RegisterInput;

    const existingUser = await db.user.findFirst({
      where: {
        OR: [{ email: input.email }, { username: input.username }],
      },
      select: {
        id: true,
      },
    });

    if (existingUser) {
      throw new AppError("User with this email or username already exists", 409);
    }

    const hashedPassword = await hashPassword(input.password);

    const user = await db.user.create({
      data: {
        username: input.username,
        email: input.email,
        password: hashedPassword,
      },
      select: {
        id: true,
        username: true,
        email: true,
        bio: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const token = generateToken({
      userId: user.id,
      username: user.username,
      email: user.email,
    });

    res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        token,
        user,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = req.body as LoginInput;

    const user = await db.user.findUnique({
      where: {
        email: input.email,
      },
    });

    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

    const isPasswordValid = await comparePassword(input.password, user.password);

    if (!isPasswordValid) {
      throw new AppError("Invalid credentials", 401);
    }

    const token = generateToken({
      userId: user.id,
      username: user.username,
      email: user.email,
    });

    res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          bio: user.bio ?? undefined,
          avatar: user.avatar ?? undefined,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function me(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const user = await db.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        username: true,
        email: true,
        bio: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const cookieOptions = getAuthCookieOptions();

    res.clearCookie(AUTH_COOKIE_NAME, {
      httpOnly: cookieOptions.httpOnly,
      sameSite: cookieOptions.sameSite,
      secure: cookieOptions.secure,
      path: cookieOptions.path,
    });

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    next(error);
  }
}
