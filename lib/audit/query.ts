import { prisma } from "@/lib/db/prisma";
import { AUDIT_ACTIONS, AUDIT_RESOURCE_TYPES } from "@/lib/audit/actions";

type AuditFilters = {
  action?: string;
  q?: string;
  resourceType?: string;
};

export type AuditListFilters = AuditFilters & {
  page?: number;
  perPage?: number;
};

export async function getAuditOverview(filters: AuditListFilters = {}) {
  const where = buildAuditWhere(filters);
  const page = Math.max(filters.page ?? 1, 1);
  const perPage = Math.min(Math.max(filters.perPage ?? 20, 1), 100);
  const skip = (page - 1) * perPage;

  const [items, total, recentCount, actionCounts, resourceCounts] =
    await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: perPage,
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
    pagination: {
      page,
      perPage,
      totalPages: Math.max(Math.ceil(total / perPage), 1),
    },
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
