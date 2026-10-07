"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AudioLines } from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/tracks", label: "Tracks" },
  { href: "/feedback", label: "Feedback" }
];

export function AppHeader() {
  const pathname = usePathname();

  if (pathname === "/login") {
    return null;
  }

  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-ink">
          <AudioLines className="h-6 w-6 text-accent" />
          Audio Review
        </Link>
        <nav className="flex gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-canvas hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
          <form action="/api/logout" method="post">
            <button
              type="submit"
              className="rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-canvas hover:text-ink"
            >
              Logout
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
