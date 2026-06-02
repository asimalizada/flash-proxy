import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/shell/logout-button";

type DashboardTopbarProps = {
  apiKeyFingerprint: string;
};

export function DashboardTopbar({ apiKeyFingerprint }: DashboardTopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/85 px-4 backdrop-blur lg:px-6">
      <div>
        <p className="text-xs font-medium uppercase text-muted-foreground">
          FlashProxy Business
        </p>
        <p className="mt-1 text-sm font-semibold">{apiKeyFingerprint}</p>
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        <LogoutButton />
      </div>
    </header>
  );
}
