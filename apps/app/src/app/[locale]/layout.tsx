import "./styles.css";
import { Toaster } from "@v1/ui/sonner";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { SignInDialog } from "@/components/auth/sign-in-dialog";
import { UserProvider } from "@/components/auth/user-context";
import { MotionProvider } from "@/components/motion/motion-provider";
import { I18nProviderClient } from "@/locales/client";
import { TRPCReactProvider } from "@/trpc/react";

export const metadata: Metadata = {
  title: {
    default: "Derby",
    template: "%s | Derby",
  },
  description:
    "Custom game leaderboard and match history for League of Legends.",
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)" },
    { media: "(prefers-color-scheme: dark)" },
  ],
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  return (
    // The font variables go on <html>: the tokens that read them (`--font-sans`, `--font-mono`) are
    // declared on :root, and a variable set lower down never reaches a declaration made above it.
    <html
      lang={locale}
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased">
        <I18nProviderClient locale={locale}>
          <TRPCReactProvider>
            <UserProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                <NuqsAdapter>
                  <MotionProvider>{children}</MotionProvider>
                </NuqsAdapter>
                <Toaster richColors={true} />
                <SignInDialog />
              </ThemeProvider>
            </UserProvider>
          </TRPCReactProvider>
        </I18nProviderClient>
      </body>
    </html>
  );
}
