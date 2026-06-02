import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SummaryCardProps = {
  label: string;
  value: string | number;
  detail?: string;
  icon: LucideIcon;
};

export function SummaryCard({
  label,
  value,
  detail,
  icon: Icon,
}: SummaryCardProps) {
  return (
    <Card className="bg-card/80">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className="size-4 text-primary" />
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tracking-normal">{value}</p>
        {detail ? <p className="mt-2 text-sm text-muted-foreground">{detail}</p> : null}
      </CardContent>
    </Card>
  );
}
