import { NextResponse } from "next/server";

import { requireSession, SessionError } from "@/lib/auth/session";
import {
  getProxyConnectionInfo,
  ProxiesError,
} from "@/lib/proxies/service";

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
      },
    },
    { status }
  );
}

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const data = await getProxyConnectionInfo(session, request);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    if (error instanceof SessionError || error instanceof ProxiesError) {
      return jsonError(error.status, error.code, error.message);
    }

    return jsonError(500, "INTERNAL_ERROR", "Unable to load connection info");
  }
}
