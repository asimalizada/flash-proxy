import { AuditExplorer } from "@/components/audit/audit-explorer";
import { getAuditOverview } from "@/lib/audit/query";
import { AUDIT_ACTIONS, AUDIT_RESOURCE_TYPES } from "@/lib/audit/actions";

type AuditPageProps = {
  searchParams?: Promise<{
    action?: string;
    page?: string;
    q?: string;
    resourceType?: string;
  }>;
};

const VALID_ACTIONS = new Set(Object.values(AUDIT_ACTIONS));
const VALID_RESOURCE_TYPES = new Set(Object.values(AUDIT_RESOURCE_TYPES));

export default async function AuditPage({ searchParams }: AuditPageProps) {
  const params = await searchParams;
  const filters = {
    action: normalizeActionFilter(params?.action),
    page: parsePositiveInteger(params?.page),
    q: params?.q || undefined,
    resourceType: normalizeResourceTypeFilter(params?.resourceType),
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

function normalizeActionFilter(value?: string) {
  if (!value || value === "all") {
    return undefined;
  }

  return VALID_ACTIONS.has(
    value as (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS]
  )
    ? value
    : undefined;
}

function normalizeResourceTypeFilter(value?: string) {
  if (!value || value === "all") {
    return undefined;
  }

  return VALID_RESOURCE_TYPES.has(
    value as (typeof AUDIT_RESOURCE_TYPES)[keyof typeof AUDIT_RESOURCE_TYPES]
  )
    ? value
    : undefined;
}

function parsePositiveInteger(value?: string) {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}
