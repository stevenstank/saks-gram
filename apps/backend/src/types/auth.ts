export type JwtPayload = {
  userId: string;
  username: string;
  email: string;
};

export type RegisterInput = {
  username: string;
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type PublicUser = {
  id: string;
  username: string;
  email: string;
  bio?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
};
