"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  function handleLogout() {
    startTransition(async () => {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
      router.replace("/login");
      router.refresh();
    });
  }

  return (
    <Button
      aria-label="Sign out"
      disabled={isPending}
      size="icon"
      variant="ghost"
      onClick={handleLogout}
    >
      <LogOut className="size-4" />
    </Button>
  );
}
