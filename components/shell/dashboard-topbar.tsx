"use client";

import { CircleDot } from "lucide-react";
import { usePathname } from "next/navigation";

import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/shell/logout-button";
import { dashboardNavItems } from "@/components/shell/nav-items";

function getPageTitle(pathname: string) {
  return (
    dashboardNavItems.find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
    )?.label ?? "Dashboard"
  );
}

export function DashboardTopbar() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/78 px-4 backdrop-blur-xl lg:px-7">
      <div>
        <p className="text-xs font-medium uppercase text-muted-foreground">
          FlashProxy Business
        </p>
        <div className="mt-1 flex items-center gap-3">
          <p className="text-sm font-semibold">{title}</p>
          <span className="hidden items-center gap-1.5 rounded-md border bg-secondary/70 px-2 py-1 text-xs font-medium text-muted-foreground sm:flex">
            <CircleDot className="size-3 fill-primary text-primary" />
            Live session
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        <LogoutButton />
      </div>
    </header>
  );
}
