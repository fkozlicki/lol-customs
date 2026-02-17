import { TitleBar } from "@/app/title-bar";
import { VersionCheckGate } from "@/app/version-check-gate";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Niunio",
  description: "Sync League custom games to Niunio",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="flex h-screen flex-col bg-background text-foreground antialiased">
        <VersionCheckGate>
          <TitleBar />
          <main className="min-h-0 flex-1 overflow-auto">{children}</main>
        </VersionCheckGate>
      </body>
    </html>
  );
}
