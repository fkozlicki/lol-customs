import { Backdrop } from "@/components/backdrop/backdrop";
import { DownloadAppDialog } from "@/components/dashboard/download-app-dialog";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { SiteFooter } from "@/components/dashboard/site-footer";
import { TopBar } from "@/components/dashboard/top-bar";
import { GamePatchProvider } from "@/components/game-assets/game-patch";
import { currentPatch } from "@/game-data/current-patch";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const patch = await currentPatch();

  return (
    <GamePatchProvider patch={patch}>
      <div className="isolate flex min-h-dvh flex-col">
        <Backdrop />
        <TopBar />
        <main className="min-w-0 flex-1">{children}</main>
        <SiteFooter />
        <MobileNav />
        <DownloadAppDialog />
      </div>
    </GamePatchProvider>
  );
}
