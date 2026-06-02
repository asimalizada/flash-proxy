import { NextResponse } from "next/server";

import {
  AUDIT_ACTIONS,
  AUDIT_RESOURCE_TYPES,
} from "@/lib/audit/actions";
import { writeAuditLog } from "@/lib/audit/log";
import { getCurrentSession, revokeCurrentSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const session = await getCurrentSession();

  if (session) {
    await writeAuditLog({
      sessionId: session.id,
      apiKeyHash: session.apiKeyHash,
      action: AUDIT_ACTIONS.LOGOUT,
      resourceType: AUDIT_RESOURCE_TYPES.AUTH,
      metadata: {
        api_key_fingerprint: session.apiKeyFingerprint,
      },
      request,
    });
  }

  await revokeCurrentSession();

  return NextResponse.json({
    success: true,
    data: {
      loggedOut: true,
    },
  });
}
