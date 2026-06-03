import { AuditExplorer } from "@/components/audit/audit-explorer";
import { getAuditOverview } from "@/lib/audit/query";

type AuditPageProps = {
  searchParams?: Promise<{
    action?: string;
    q?: string;
    resourceType?: string;
  }>;
};

export default async function AuditPage({ searchParams }: AuditPageProps) {
  const params = await searchParams;
  const filters = {
    action: params?.action || undefined,
    q: params?.q || undefined,
    resourceType: params?.resourceType || undefined,
  };
  const overview = await getAuditOverview(filters);

  return (
    <AuditExplorer
      actionCounts={overview.actionCounts}
      filters={filters}
      items={overview.items}
      recentCount={overview.recentCount}
      resourceCounts={overview.resourceCounts}
      total={overview.total}
    />
  );
}
