import type { NextRequest } from "next/server";

export type RequestContext = {
  ipAddress?: string;
  userAgent?: string;
};

export function getRequestContext(request: Request | NextRequest): RequestContext {
  const headers = request.headers;
  const forwardedFor = headers.get("x-forwarded-for");
  const realIp = headers.get("x-real-ip");

  return {
    ipAddress: forwardedFor?.split(",")[0]?.trim() || realIp || undefined,
    userAgent: headers.get("user-agent") ?? undefined,
  };
}
