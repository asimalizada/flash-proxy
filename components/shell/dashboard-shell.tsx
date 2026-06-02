import type * as React from "react";

import { DashboardSidebar } from "@/components/shell/dashboard-sidebar";
import { DashboardTopbar } from "@/components/shell/dashboard-topbar";
import { MobileBottomNav } from "@/components/shell/mobile-bottom-nav";

type DashboardShellProps = {
  apiKeyFingerprint: string;
  children: React.ReactNode;
};

export function DashboardShell({
  apiKeyFingerprint,
  children,
}: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <DashboardSidebar apiKeyFingerprint={apiKeyFingerprint} />
        <div className="flex min-h-screen flex-1 flex-col">
          <DashboardTopbar apiKeyFingerprint={apiKeyFingerprint} />
          <main className="flex-1 px-4 pb-24 pt-6 lg:px-6 lg:pb-8">
            {children}
          </main>
        </div>
      </div>
      <MobileBottomNav />
    </div>
  );
}
