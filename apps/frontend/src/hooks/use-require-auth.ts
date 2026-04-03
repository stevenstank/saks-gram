"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "./use-auth";

type UseRequireAuthResult = {
  isCheckingAuth: boolean;
};

export function useRequireAuth(): UseRequireAuthResult {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isBootstrapping } = useAuth();

  useEffect(() => {
    if (isBootstrapping || isAuthenticated) {
      return;
    }

    const next = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
    router.replace(`/login${next}`);
  }, [isAuthenticated, isBootstrapping, pathname, router]);

  return {
    isCheckingAuth: isBootstrapping || !isAuthenticated,
  };
}
