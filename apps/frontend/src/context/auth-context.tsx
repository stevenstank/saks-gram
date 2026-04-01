"use client";

import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { getMe, loginRequest, registerRequest } from "../lib/api";
import type { AuthUser, LoginInput, RegisterInput } from "../types/auth";

export type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  login: (input: LoginInput) => Promise<void>;
  signup: (input: RegisterInput) => Promise<void>;
  logout: () => void;
};

const AUTH_TOKEN_KEY = "saksgram.auth.token";
const AUTH_USER_KEY = "saksgram.auth.user";

export const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const persistSession = useCallback((nextToken: string, nextUser: AuthUser) => {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem(AUTH_TOKEN_KEY, nextToken);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser));
  }, []);

  const clearSession = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  }, []);

  const login = useCallback(
    async (input: LoginInput) => {
      const response = await loginRequest(input);
      persistSession(response.data.token, response.data.user);
    },
    [persistSession],
  );

  const signup = useCallback(
    async (input: RegisterInput) => {
      const response = await registerRequest(input);
      persistSession(response.data.token, response.data.user);
    },
    [persistSession],
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  useEffect(() => {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    const storedUser = localStorage.getItem(AUTH_USER_KEY);

    if (!storedToken || !storedUser) {
      setIsBootstrapping(false);
      return;
    }

    let parsedUser: AuthUser;

    try {
      parsedUser = JSON.parse(storedUser) as AuthUser;
    } catch {
      clearSession();
      setIsBootstrapping(false);
      return;
    }

    setToken(storedToken);
    setUser(parsedUser);

    getMe(storedToken)
      .then((response) => {
        setUser(response.data.user);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.data.user));
      })
      .catch(() => {
        clearSession();
      })
      .finally(() => {
        setIsBootstrapping(false);
      });
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isBootstrapping,
      login,
      signup,
      logout,
    }),
    [isBootstrapping, login, logout, signup, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
