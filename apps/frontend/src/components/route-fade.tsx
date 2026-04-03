"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

type RouteFadeProps = {
  children: ReactNode;
};

export function RouteFade({ children }: RouteFadeProps) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="animate-route-fade">
      {children}
    </div>
  );
}
