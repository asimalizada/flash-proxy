import { AuditExplorer } from "@/components/audit/audit-explorer";
import { getAuditOverview } from "@/lib/audit/query";

type AuditPageProps = {
  searchParams?: Promise<{
    action?: string;
    page?: string;
    q?: string;
    resourceType?: string;
  }>;
};

export default async function AuditPage({ searchParams }: AuditPageProps) {
  const params = await searchParams;
  const filters = {
    action: normalizeFilter(params?.action),
    page: parsePositiveInteger(params?.page),
    q: params?.q || undefined,
    resourceType: normalizeFilter(params?.resourceType),
  };
  const overview = await getAuditOverview(filters);

  return (
    <AuditExplorer
      actionCounts={overview.actionCounts}
      filters={filters}
      items={overview.items}
      pagination={overview.pagination}
      recentCount={overview.recentCount}
      resourceCounts={overview.resourceCounts}
      total={overview.total}
    />
  );
}

function normalizeFilter(value?: string) {
  if (!value || value === "all") {
    return undefined;
  }

  return value;
}

function parsePositiveInteger(value?: string) {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}
