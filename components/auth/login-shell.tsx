import type * as React from "react";
import { Globe2 } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import styles from "@/components/auth/login.module.css";

export function LoginShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className={`${styles.authGrid} absolute inset-0 opacity-70`} />
      <div className={`${styles.authScanline} absolute inset-x-0 top-0 h-px`} />

      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-6">
        <div className="flex items-center justify-between">
          <BrandMark />
          <ThemeToggle />
        </div>

        <section className="flex flex-1 flex-col items-center justify-center pb-16 pt-10">
          <AnimatedWordmark />
          <div className="mt-10 w-full max-w-sm sm:mt-12">{children}</div>
        </section>
      </div>
    </main>
  );
}

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex size-10 items-center justify-center rounded-md border bg-card shadow-sm">
        <Globe2 className="size-5 text-primary" />
        <span className="absolute -right-1 -top-1 size-3 rounded-full bg-primary" />
      </div>
      <div>
        <p className="text-sm font-medium leading-none">FlashProxy</p>
        <p className="mt-1 text-xs text-muted-foreground">Business</p>
      </div>
    </div>
  );
}

function AnimatedWordmark() {
  const letters = "FlashProxy".split("");

  return (
    <div className="text-center">
      <h1
        aria-label="FlashProxy"
        className="flex justify-center text-6xl font-semibold leading-none tracking-normal text-foreground sm:text-7xl"
      >
        {letters.map((letter, index) => (
          <span
            className={styles.brandLetter}
            key={`${letter}-${index}`}
            style={{ animationDelay: `${index * 95}ms` }}
          >
            {letter}
          </span>
        ))}
      </h1>
      <p
        className={`${styles.brandSubtitle} mt-4 text-sm font-medium uppercase text-muted-foreground`}
      >
        Reseller access
      </p>
    </div>
  );
}
