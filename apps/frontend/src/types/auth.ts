export type AuthUser = {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
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

export type AuthSuccessResponse = {
  success: true;
  message: string;
  data: {
    token: string;
    user: AuthUser;
  };
};

export type AuthMeResponse = {
  success: true;
  data: {
    user: AuthUser;
  };
};
