import {
  Building2,
  Home,
  Infinity,
  Server,
  Smartphone,
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  getProductDisplay,
} from "@/components/purchase/purchase-utils";
import {
  PRODUCT_OPTIONS,
  POOL_PRODUCT_OPTIONS,
  POOL_PRODUCTS,
  isPoolProduct,
  type PurchaseProduct,
} from "@/lib/purchase/products";

type ProductSelectValue =
  | Exclude<PurchaseProduct, (typeof POOL_PRODUCTS)[number]>
  | "pools";
type PoolProduct = (typeof POOL_PRODUCTS)[number];

const POOL_ICON_LABELS: Record<PoolProduct, string> = {
  pool1: "N",
  pool2: "I",
  pool3: "O",
  pool4: "B",
  pool5: "F",
};

const PRODUCT_SELECT_OPTIONS = [
  ...PRODUCT_OPTIONS.filter(
    (option) => !(POOL_PRODUCTS as readonly string[]).includes(option.value)
  ),
  {
    value: "pools",
    label: "Pool (1-5)",
    group: "Pools",
    defaultGb: 5,
  },
] as const;

type ProductStepProps = {
  product: PurchaseProduct;
  onProductChange: (value: PurchaseProduct) => void;
};

export function ProductStep({
  product,
  onProductChange,
}: ProductStepProps) {
  const selectedProduct = getProductDisplay(product);
  const productSelectValue = (
    isPoolProduct(product) ? "pools" : product
  ) as ProductSelectValue;
  const selectedPoolLabel = isPoolProduct(product)
    ? `Pool ${product.replace("pool", "")}`
    : "";

  return (
    <section className="mx-auto flex min-h-[360px] max-w-3xl items-center">
      <div className="w-full space-y-5">
        <div className="rounded-md border bg-background/56 p-4">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Product
          </p>
          <p className="mt-2 text-xl font-semibold">{selectedProduct?.label}</p>
        </div>

        <Select
          onValueChange={(value) => {
            onProductChange(
              value === "pools" ? "pool1" : (value as PurchaseProduct)
            );
          }}
          value={productSelectValue}
        >
          <SelectTrigger className="h-16 rounded-lg border bg-card/86 px-4 text-base shadow-[0_16px_38px_color-mix(in_oklch,var(--foreground)_7%,transparent)] transition-all duration-200 hover:border-primary/35 [&>span]:!grid">
            <ProductOptionContent
              group={selectedProduct?.group}
              label={selectedProduct?.label ?? ""}
              product={productSelectValue}
            />
          </SelectTrigger>
          <SelectContent
            className="max-h-[430px] rounded-lg border bg-popover/98 p-1 shadow-[0_20px_60px_color-mix(in_oklch,var(--foreground)_18%,transparent)] backdrop-blur-xl"
            position="popper"
          >
            {PRODUCT_SELECT_OPTIONS.map((option) => (
              <SelectItem
                className="h-12 rounded-md pl-9 pr-3 text-sm focus:bg-primary/10 [&>span:first-child]:left-3"
                key={option.value}
                value={option.value}
              >
                <ProductOptionContent
                  group={option.group}
                  label={option.label}
                  product={option.value as ProductSelectValue}
                />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isPoolProduct(product) ? (
          <Select
            onValueChange={(value) => onProductChange(value as PurchaseProduct)}
            value={product}
          >
            <SelectTrigger className="h-14 rounded-lg border bg-card/76 px-4 text-base transition-all duration-200 hover:border-primary/35 [&>span]:!grid">
              <ProductOptionContent
                group="Pools"
                label={selectedPoolLabel}
                product={product}
              />
            </SelectTrigger>
            <SelectContent
              className="rounded-lg border bg-popover/98 p-1 shadow-[0_18px_48px_color-mix(in_oklch,var(--foreground)_16%,transparent)] backdrop-blur-xl"
              position="popper"
            >
              {POOL_PRODUCT_OPTIONS.map((option) => (
                <SelectItem
                  className="h-11 rounded-md pl-9 pr-3 text-sm focus:bg-primary/10 [&>span:first-child]:left-3"
                  key={option.value}
                  value={option.value}
                >
                  <ProductOptionContent
                    group="Pools"
                    label={option.label.replace("Residential ", "")}
                    product={option.value as PoolProduct}
                  />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>
    </section>
  );
}

function ProductOptionContent({
  product,
  label,
  group,
}: {
  product: ProductSelectValue | PoolProduct;
  label: string;
  group?: string;
}) {
  return (
    <span className="!grid min-w-0 grid-cols-[2rem_1fr] items-center gap-3">
      <ProductIcon product={product} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{label}</span>
        {group ? (
          <span className="mt-0.5 block truncate text-xs leading-none text-muted-foreground">
            {group}
          </span>
        ) : null}
      </span>
    </span>
  );
}

function ProductIcon({ product }: { product: ProductSelectValue | PoolProduct }) {
  if (product === "mobile" || product === "mobile_usa") {
    return (
      <span className="flex size-8 shrink-0 items-center justify-center text-xs font-semibold text-muted-foreground">
        {product === "mobile_usa" ? "USA" : "4G"}
      </span>
    );
  }

  if (product === "datacenter") {
    return (
      <span className="flex size-8 shrink-0 items-center justify-center">
        <Building2 className="size-4 text-muted-foreground" />
      </span>
    );
  }

  if (product === "shared_isp" || product === "dedicated_isp") {
    return (
      <span className="flex size-8 shrink-0 items-center justify-center text-xs font-semibold text-muted-foreground">
        ISP
      </span>
    );
  }

  if (product === "ipv6-residential" || product === "ipv6-datacenter") {
    return (
      <span className="flex size-8 shrink-0 items-center justify-center text-xs font-semibold text-muted-foreground">
        V6
      </span>
    );
  }

  if (product === "pools" || product.startsWith("pool")) {
    return (
      <span className="flex size-8 shrink-0 items-center justify-center text-base font-semibold text-muted-foreground">
        {product === "pools" ? "N" : POOL_ICON_LABELS[product as PoolProduct]}
      </span>
    );
  }

  if (product === "unlimited_residential") {
    return (
      <span className="flex size-8 shrink-0 items-center justify-center">
        <Infinity className="size-4 text-muted-foreground" />
      </span>
    );
  }

  if (product === "residential-lite") {
    return (
      <span className="flex size-8 shrink-0 items-center justify-center">
        <Home className="size-4 text-muted-foreground" />
      </span>
    );
  }

  if (product === "residential") {
    return (
      <span className="flex size-8 shrink-0 items-center justify-center">
        <Server className="size-4 text-muted-foreground" />
      </span>
    );
  }

  return (
    <span className="flex size-8 shrink-0 items-center justify-center">
      <Smartphone className="size-4 text-muted-foreground" />
    </span>
  );
}
