"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "../hooks/use-auth";
import { Button } from "./ui/button";

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const profileHref = user?.username ? `/profile/${encodeURIComponent(user.username)}` : "/profile";

  function linkClasses(isActive: boolean): string {
    return [
      "rounded-xl px-3 py-2 text-sm font-medium transition duration-200",
      isActive
        ? "bg-yellow-400 text-black ring-1 ring-yellow-400/40"
        : "text-white hover:bg-gray-800 hover:text-white",
    ].join(" ");
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-800 bg-black/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-xl font-bold tracking-tight text-white">
          SaksGram
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <nav className="flex items-center gap-1">
            <Link href="/feed" className={linkClasses(pathname === "/feed")}>
              Feed
            </Link>
            <Link href="/messages" className={linkClasses(pathname.startsWith("/messages"))}>
              Messages
            </Link>
            <Link href={profileHref} className={linkClasses(pathname.startsWith("/profile"))}>
              Profile
            </Link>
            <Button
              type="button"
              variant="ghost"
              onClick={logout}
              className="px-3 text-white hover:bg-gray-900 hover:text-white"
            >
              Logout
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
