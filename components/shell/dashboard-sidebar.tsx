"use client";

import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";

import { dashboardNavItems } from "@/components/shell/nav-items";
import { cn } from "@/lib/utils";

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-72 shrink-0 border-r bg-card/82 p-4 shadow-[18px_0_44px_color-mix(in_oklch,var(--foreground)_5%,transparent)] backdrop-blur-xl lg:sticky lg:top-0 lg:block">
      <div className="flex h-full flex-col">
        <div className="mb-9 flex items-center gap-3 px-2 pt-2">
          <div className="relative flex size-11 items-center justify-center rounded-md border bg-background shadow-sm transition-transform duration-300 hover:-translate-y-0.5">
            <span className="text-lg font-semibold text-primary">F</span>
            <span className="absolute -right-1 -top-1 size-3 rounded-full bg-primary shadow-[0_0_0_4px_color-mix(in_oklch,var(--primary)_14%,transparent)]" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">FlashProxy</p>
            <p className="mt-1 text-xs text-muted-foreground">Business</p>
          </div>
        </div>

        <nav className="space-y-1">
          {dashboardNavItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                className={cn(
                  "group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:-translate-y-px hover:bg-secondary/80 hover:text-foreground",
                  isActive &&
                    "bg-primary/10 text-foreground shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--primary)_20%,transparent)]"
                )}
                href={item.href}
                key={item.href}
              >
                <span
                  className={cn(
                    "absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary opacity-0 transition-opacity",
                    isActive && "opacity-100"
                  )}
                />
                <item.icon
                  className={cn(
                    "size-4 text-primary transition-transform duration-200 group-hover:scale-110",
                    isActive && "drop-shadow-[0_0_10px_color-mix(in_oklch,var(--primary)_38%,transparent)]"
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          className="group mt-auto overflow-hidden rounded-md border bg-background/72 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_14px_36px_color-mix(in_oklch,var(--primary)_10%,transparent)]"
          href="/buy"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </div>
            <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
          </div>
          <p className="mt-4 text-sm font-semibold">Buy proxy</p>
          <p className="mt-1 text-xs text-muted-foreground">Create new plans</p>
        </Link>
      </div>
    </aside>
  );
}
