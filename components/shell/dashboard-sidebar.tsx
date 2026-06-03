"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Sparkles, Wallet } from "lucide-react";
import { usePathname } from "next/navigation";

import { dashboardNavItems } from "@/components/shell/nav-items";
import styles from "@/components/auth/login.module.css";
import { cn } from "@/lib/utils";

type BalanceResponse =
  | {
      success: true;
      data: {
        balance_formatted?: string;
        total_spent_formatted?: string;
      };
    }
  | { success: false };

export function DashboardSidebar() {
  const pathname = usePathname();
  const [balance, setBalance] = useState<{
    available: string;
    spent: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadBalance() {
      try {
        const response = await fetch("/api/balance", {
          cache: "no-store",
          method: "GET",
        });
        const json = (await response.json()) as BalanceResponse;

        if (!cancelled && response.ok && json.success) {
          setBalance({
            available: json.data.balance_formatted ?? "--",
            spent: json.data.total_spent_formatted ?? "--",
          });
        }
      } catch {
        if (!cancelled) {
          setBalance(null);
        }
      }
    }

    void loadBalance();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <aside className="relative hidden h-screen w-72 shrink-0 overflow-hidden border-r bg-card/82 p-4 shadow-[18px_0_44px_color-mix(in_oklch,var(--foreground)_5%,transparent)] backdrop-blur-xl lg:sticky lg:top-0 lg:block">
      <div className={`${styles.authGrid} pointer-events-none absolute inset-0 opacity-25`} />
      <div className={`${styles.authScanline} pointer-events-none absolute inset-x-0 top-0 h-px opacity-60`} />

      <div className="relative flex h-full flex-col">
        <div className="mb-9 px-2 pt-2">
          <Link aria-label="Dashboard" className="block" href="/dashboard">
            <p
              aria-label="FlashProxy"
              className="flex text-2xl font-semibold leading-none tracking-normal"
            >
              {"FlashProxy".split("").map((letter, index) => (
                <span
                  className={styles.brandLetter}
                  key={`${letter}-${index}`}
                  style={{ animationDelay: `${index * 45}ms` }}
                >
                  {letter}
                </span>
              ))}
            </p>
            <p
              className={`${styles.brandSubtitle} mt-2 text-xs font-medium uppercase text-muted-foreground`}
            >
              Reseller dashboard
            </p>
          </Link>
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

        <div className="mt-auto space-y-3">
          <Link
            className="group relative block overflow-hidden rounded-md border bg-background/72 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_14px_36px_color-mix(in_oklch,var(--primary)_10%,transparent)]"
            href="/balance"
          >
            <div className="absolute inset-y-0 right-0 w-2/3 bg-[linear-gradient(115deg,transparent,color-mix(in_oklch,var(--primary)_10%,transparent))]" />
            <div className="relative flex items-center justify-between gap-3">
              <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Wallet className="size-4" />
              </div>
              <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
            </div>
            <div className="relative mt-4">
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Balance
              </p>
              <p className="mt-1 text-2xl font-semibold tracking-normal">
                {balance?.available ?? "--"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Spent {balance?.spent ?? "--"}
              </p>
            </div>
          </Link>

          <Link
            className="group block overflow-hidden rounded-md border bg-background/72 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_14px_36px_color-mix(in_oklch,var(--primary)_10%,transparent)]"
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
      </div>
    </aside>
  );
}
