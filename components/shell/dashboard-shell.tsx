import type * as React from "react";

import { DashboardSidebar } from "@/components/shell/dashboard-sidebar";
import { DashboardTopbar } from "@/components/shell/dashboard-topbar";
import { MobileBottomNav } from "@/components/shell/mobile-bottom-nav";
import styles from "@/components/shell/dashboard-shell.module.css";
import { cn } from "@/lib/utils";

type DashboardShellProps = {
  children: React.ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className={cn(styles.shell, "min-h-screen bg-background text-foreground")}>
      <div className="relative z-10 flex min-h-screen">
        <DashboardSidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <DashboardTopbar />
          <main className="flex-1 px-4 pb-24 pt-6 lg:px-7 lg:pb-8">
            {children}
          </main>
        </div>
      </div>
      <MobileBottomNav />
    </div>
  );
}
