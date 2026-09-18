import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "FreeTube – Copyright-Free YouTube Downloader",
  description:
    "Search and download Creative Commons licensed YouTube videos. Safe, legal, and Safari-optimized.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <body className="bg-[#0f0f0f] text-white antialiased">{children}</body>
    </html>
  );
}
