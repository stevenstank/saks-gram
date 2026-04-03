"use client";

import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { getMe, loginRequest, logoutRequest, registerRequest } from "../lib/api";
import type { AuthUser, LoginInput, RegisterInput } from "../types/auth";

export type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  login: (input: LoginInput) => Promise<void>;
  signup: (input: RegisterInput) => Promise<void>;
  logout: () => void;
};

const AUTH_USER_KEY = "saksgram.auth.user";

export const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const persistSession = useCallback((nextUser: AuthUser) => {
    setUser(nextUser);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser));
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    localStorage.removeItem(AUTH_USER_KEY);
  }, []);

  const login = useCallback(
    async (input: LoginInput) => {
      const response = await loginRequest(input);
      persistSession(response.data.user);
    },
    [persistSession],
  );

  const signup = useCallback(
    async (input: RegisterInput) => {
      const response = await registerRequest(input);
      persistSession(response.data.user);
    },
    [persistSession],
  );

  const logout = useCallback(() => {
    void logoutRequest().catch(() => {
      // Ignore logout network failures; local session is still cleared.
    });
    clearSession();
  }, [clearSession]);

  useEffect(() => {
    const storedUser = localStorage.getItem(AUTH_USER_KEY);

    if (!storedUser) {
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

    setUser(parsedUser);

    getMe()
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
      isAuthenticated: Boolean(user),
      isBootstrapping,
      login,
      signup,
      logout,
    }),
    [isBootstrapping, login, logout, signup, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
