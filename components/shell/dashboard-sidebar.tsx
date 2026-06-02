import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { dashboardNavItems } from "@/components/shell/nav-items";

type DashboardSidebarProps = {
  apiKeyFingerprint: string;
};

export function DashboardSidebar({
  apiKeyFingerprint,
}: DashboardSidebarProps) {
  return (
    <aside className="hidden h-screen w-72 shrink-0 border-r bg-card/70 p-4 backdrop-blur lg:sticky lg:top-0 lg:block">
      <div className="flex h-full flex-col">
        <div className="mb-8 flex items-center gap-3 px-2 pt-2">
          <div className="relative flex size-10 items-center justify-center rounded-md border bg-background shadow-sm">
            <span className="text-lg font-semibold text-primary">F</span>
            <span className="absolute -right-1 -top-1 size-3 rounded-full bg-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">FlashProxy</p>
            <p className="mt-1 text-xs text-muted-foreground">Business</p>
          </div>
        </div>

        <nav className="space-y-1">
          {dashboardNavItems.map((item) => (
            <Link
              className="group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              href={item.href}
              key={item.href}
            >
              <item.icon className="size-4 text-primary transition-transform group-hover:scale-110" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto rounded-md border bg-background/70 p-3">
          <p className="text-xs font-medium uppercase text-muted-foreground">
            API key
          </p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <code className="text-sm font-medium">{apiKeyFingerprint}</code>
            <Badge variant="secondary">Active</Badge>
          </div>
        </div>
      </div>
    </aside>
  );
}
