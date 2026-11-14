import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GBI PTC Rayon 1G",
  description: "Catatan kehadiran dan kalender acara GBI PTC Rayon 1G.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
