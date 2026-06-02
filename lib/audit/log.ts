import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import type { AuditAction, AuditResourceType } from "@/lib/audit/actions";
import { getRequestContext, type RequestContext } from "@/lib/audit/context";

export type AuditMetadata = Prisma.InputJsonValue;

export type WriteAuditLogInput = {
  sessionId?: string | null;
  apiKeyHash?: string | null;
  action: AuditAction;
  resourceType?: AuditResourceType | string | null;
  resourceId?: string | null;
  metadata?: AuditMetadata;
  request?: Request;
  context?: RequestContext;
};

export async function writeAuditLog(input: WriteAuditLogInput) {
  const requestContext = input.request
    ? getRequestContext(input.request)
    : input.context;

  try {
    await prisma.auditLog.create({
      data: {
        sessionId: input.sessionId ?? null,
        apiKeyHash: input.apiKeyHash ?? null,
        action: input.action,
        resourceType: input.resourceType ?? null,
        resourceId: input.resourceId ?? null,
        metadata: input.metadata ?? undefined,
        ipAddress: requestContext?.ipAddress,
        userAgent: requestContext?.userAgent,
      },
    });
  } catch (error) {
    console.warn("Failed to write audit log", error);
  }
}
