import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Custom Ladder LCU",
  description: "Sync League custom games to your ladder",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
