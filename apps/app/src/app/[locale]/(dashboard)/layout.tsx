import { SidebarInset } from "@v1/ui/sidebar";
import { AppHeader } from "@/components/dashboard/app-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { MobileNav } from "@/components/dashboard/mobile-nav";

interface DashboardLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function DashboardLayout({
  children,
  params,
}: DashboardLayoutProps) {
  const { locale } = await params;

  return (
    <DashboardSidebar locale={locale}>
      <SidebarInset className="overflow-hidden">
        <AppHeader />
        <div className="flex-1 overflow-auto">{children}</div>
        <MobileNav />
      </SidebarInset>
    </DashboardSidebar>
  );
}
