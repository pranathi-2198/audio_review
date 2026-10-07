"use client";

import { usePathname } from "next/navigation";

export function AppContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8">{children}</main>;
}
