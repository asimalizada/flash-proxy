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
};

export function ProductUsage({ products }: ProductUsageProps) {
  const entries = Object.entries(products)
    .sort(([, left], [, right]) => (right.bytes_used ?? 0) - (left.bytes_used ?? 0))
    .slice(0, 5);

  return (
    <Card className="bg-card/80">
      <CardHeader>
        <CardTitle>Products</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length ? (
          <div className="space-y-4">
            {entries.map(([product, value]) => (
              <div className="flex items-center justify-between gap-4" key={product}>
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
          <div className="flex h-44 items-center justify-center rounded-md border bg-background/60 text-sm text-muted-foreground">
            No usage yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}
