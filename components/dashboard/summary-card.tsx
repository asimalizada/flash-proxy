import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SummaryCardProps = {
  label: string;
  value: string | number;
  detail?: string;
  icon: LucideIcon;
  isLoading?: boolean;
  tone?: "primary" | "amber" | "blue" | "rose";
};

export function SummaryCard({
  label,
  value,
  detail,
  icon: Icon,
  isLoading = false,
  tone = "primary",
}: SummaryCardProps) {
  const toneClass = {
    primary: "from-primary/24 text-primary",
    amber: "from-chart-3/24 text-chart-3",
    blue: "from-chart-2/22 text-chart-2",
    rose: "from-chart-4/20 text-chart-4",
  }[tone];

  return (
    <Card className="group relative overflow-hidden bg-card/86 shadow-[0_12px_34px_color-mix(in_oklch,var(--foreground)_5%,transparent)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_18px_42px_color-mix(in_oklch,var(--primary)_10%,transparent)]">
      <div className={cn("absolute inset-x-0 top-0 h-px bg-gradient-to-r to-transparent", toneClass)} />
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <span className={cn("flex size-9 items-center justify-center rounded-md bg-gradient-to-br to-transparent transition-transform duration-300 group-hover:scale-105", toneClass)}>
          <Icon className="size-4" />
        </span>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-8 w-24 rounded-md bg-primary/10" />
            <div className="h-4 w-20 rounded-md bg-muted" />
          </div>
        ) : (
          <p className="text-3xl font-semibold tracking-normal lg:text-[2rem]">
            {value}
          </p>
        )}
        {detail && !isLoading ? (
          <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
