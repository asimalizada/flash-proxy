import type * as React from "react";

export function LoginShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-md flex-col justify-center px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-medium text-muted-foreground">
            FlashProxy Business
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">
            Sign in
          </h1>
        </div>
        {children}
      </section>
    </main>
  );
}
