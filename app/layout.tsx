import type { Metadata } from "next";
import { AppContent } from "@/components/AppContent";
import { AppHeader } from "@/components/AppHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "Audio Review",
  description: "Internal audio track review and feedback workflow"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">
        <AppHeader />
        <AppContent>{children}</AppContent>
      </body>
    </html>
  );
}
