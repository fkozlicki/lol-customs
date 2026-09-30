import { latestPatch } from "@v1/game-assets/patch";
import { GamePatchProvider } from "@v1/ui/recipes/game-assets/game-patch";
import { Backdrop } from "@/components/backdrop/backdrop";
import { DownloadAppDialog } from "@/components/dashboard/download-app-dialog";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { SiteFooter } from "@/components/dashboard/site-footer";
import { TopBar } from "@/components/dashboard/top-bar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Data Dragon publishes a patch every two weeks; asking once an hour is plenty.
  const patch = await latestPatch({ init: { next: { revalidate: 3600 } } });

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
