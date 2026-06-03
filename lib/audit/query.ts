import { prisma } from "@/lib/db/prisma";
import { AUDIT_ACTIONS, AUDIT_RESOURCE_TYPES } from "@/lib/audit/actions";

type AuditFilters = {
  action?: string;
  q?: string;
  resourceType?: string;
};

export type AuditListFilters = AuditFilters & {
  limit?: number;
};

export async function getAuditOverview(filters: AuditListFilters = {}) {
  const where = buildAuditWhere(filters);
  const limit = Math.min(filters.limit ?? 50, 100);

  const [items, total, recentCount, actionCounts, resourceCounts] =
    await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
      }),
      prisma.auditLog.count({ where }),
      prisma.auditLog.count({
        where: {
          ...where,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.auditLog.groupBy({
        by: ["action"],
        _count: {
          action: true,
        },
        where,
        orderBy: {
          _count: {
            action: "desc",
          },
        },
        take: 5,
      }),
      prisma.auditLog.groupBy({
        by: ["resourceType"],
        _count: {
          resourceType: true,
        },
        where,
        orderBy: {
          _count: {
            resourceType: "desc",
          },
        },
        take: 5,
      }),
    ]);

  return {
    items,
    total,
    recentCount,
    actionCounts,
    resourceCounts,
  };
}

export const auditActionOptions = Object.values(AUDIT_ACTIONS);
export const auditResourceTypeOptions = Object.values(AUDIT_RESOURCE_TYPES);

function buildAuditWhere(filters: AuditFilters) {
  const q = filters.q?.trim();

  return {
    ...(filters.action ? { action: filters.action } : {}),
    ...(filters.resourceType ? { resourceType: filters.resourceType } : {}),
    ...(q
      ? {
          OR: [
            {
              resourceId: {
                contains: q,
                mode: "insensitive" as const,
              },
            },
            {
              apiKeyHash: {
                contains: q,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
  };
}
