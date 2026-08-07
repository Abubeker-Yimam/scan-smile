import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scan & Smile",
  description: "One scan, a lifetime of memories.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..900;1,9..144,400..700&family=Karla:ital,wght@0,300..800;1,400..600&family=IBM+Plex+Mono:wght@400;500;600&family=Noto+Sans+Ethiopic:wght@400..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
