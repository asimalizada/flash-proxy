import { ArrowRight, Gauge, KeyRound, ShieldCheck } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <main className="min-h-screen bg-background p-6 text-foreground md:p-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              FlashProxy Business
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal">
              Reseller Dashboard
            </h1>
          </div>
          <ThemeToggle />
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="overflow-hidden">
            <CardHeader className="pb-4">
              <Badge className="w-fit" variant="secondary">
                UI foundation
              </Badge>
              <CardTitle className="max-w-2xl text-4xl leading-tight tracking-normal">
                Premium reseller operations, built on shadcn/ui.
              </CardTitle>
              <CardDescription className="max-w-2xl text-base leading-7">
                The base design system is ready for API-key login, proxy
                purchasing, usage analytics, and audit trails.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button>
                Continue setup
                <ArrowRight className="size-4" />
              </Button>
              <Button variant="outline">View roadmap</Button>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                <div className="rounded-md bg-primary/10 p-2 text-primary">
                  <KeyRound className="size-5" />
                </div>
                <div>
                  <CardTitle>Secure sessions</CardTitle>
                  <CardDescription>Encrypted API-key storage path.</CardDescription>
                </div>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                <div className="rounded-md bg-accent p-2 text-accent-foreground">
                  <Gauge className="size-5" />
                </div>
                <div>
                  <CardTitle>Analytics ready</CardTitle>
                  <CardDescription>Chart tokens and Recharts installed.</CardDescription>
                </div>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                <div className="rounded-md bg-secondary p-2 text-secondary-foreground">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <CardTitle>Audit-first</CardTitle>
                  <CardDescription>Designed for tracked reseller actions.</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
