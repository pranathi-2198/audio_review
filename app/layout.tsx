import type { Metadata } from "next";
import Link from "next/link";
import { AudioLines } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Audio Review",
  description: "Internal audio track review and feedback workflow"
};

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/tracks", label: "Tracks" },
  { href: "/feedback", label: "Feedback" }
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">
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
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8">{children}</main>
      </body>
    </html>
  );
}
