import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type FieldPanelProps = {
  icon: ReactNode;
  label: string;
  children: ReactNode;
  className?: string;
};

export function FieldPanel({
  icon,
  label,
  children,
  className,
}: FieldPanelProps) {
  return (
    <div
      className={cn(
        "rounded-md border bg-background/62 p-4 shadow-sm transition-all duration-200 hover:border-primary/28",
        className
      )}
    >
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
          {icon}
        </span>
        {label}
      </div>
      {children}
    </div>
  );
}
