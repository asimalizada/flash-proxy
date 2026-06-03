"use client";

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
        <p className="text-lg font-semibold tracking-normal">{title}</p>
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        <LogoutButton />
      </div>
    </header>
  );
}
