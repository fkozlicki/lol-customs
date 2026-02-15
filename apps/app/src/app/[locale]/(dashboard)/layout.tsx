import { SidebarInset } from "@v1/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";

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
      <SidebarInset>
        <div className="flex-1 overflow-auto p-4 max-w-3xl mx-auto w-full">
          {children}
        </div>
      </SidebarInset>
    </DashboardSidebar>
  );
}
