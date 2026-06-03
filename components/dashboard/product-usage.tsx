import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ProductUsageProps = {
  products: Record<
    string,
    {
      bytes_used?: number;
      bytes_formatted?: string;
      plans_count?: number;
    }
  >;
  isLoading?: boolean;
};

export function ProductUsage({
  products,
  isLoading = false,
}: ProductUsageProps) {
  if (isLoading) {
    return (
      <Card className="bg-card/86 shadow-[0_12px_34px_color-mix(in_oklch,var(--foreground)_5%,transparent)] transition-all duration-300 hover:border-primary/25">
        <CardHeader>
          <CardTitle>Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[0, 1, 2, 3].map((item) => (
              <div
                className="flex items-center justify-between gap-4 rounded-md border bg-background/48 px-3 py-3"
                key={item}
              >
                <div className="space-y-2">
                  <div className="h-4 w-28 rounded-md bg-primary/10" />
                  <div className="h-3 w-16 rounded-md bg-muted" />
                </div>
                <div className="h-6 w-16 rounded-md bg-muted" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const entries = Object.entries(products)
    .sort(([, left], [, right]) => (right.bytes_used ?? 0) - (left.bytes_used ?? 0))
    .slice(0, 5);

  return (
    <Card className="bg-card/86 shadow-[0_12px_34px_color-mix(in_oklch,var(--foreground)_5%,transparent)] transition-all duration-300 hover:border-primary/25">
      <CardHeader>
        <CardTitle>Products</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length ? (
          <div className="space-y-4">
            {entries.map(([product, value]) => (
              <div className="group flex items-center justify-between gap-4 rounded-md border bg-background/48 px-3 py-3 transition-all duration-200 hover:-translate-y-px hover:border-primary/30" key={product}>
                <div>
                  <p className="font-medium">{product}</p>
                  <p className="text-sm text-muted-foreground">
                    {value.bytes_formatted ?? "0 GB"}
                  </p>
                </div>
                <Badge variant="secondary">{value.plans_count ?? 0} plans</Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="relative flex h-52 items-center justify-center overflow-hidden rounded-md border bg-background/56 text-sm text-muted-foreground">
            <div className="absolute inset-x-8 top-10 space-y-3 opacity-75">
              <div className="h-2 w-3/4 rounded-full bg-primary/12" />
              <div className="h-2 w-1/2 rounded-full bg-chart-2/12" />
              <div className="h-2 w-2/3 rounded-full bg-chart-3/14" />
            </div>
            <span className="relative">No usage yet</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
