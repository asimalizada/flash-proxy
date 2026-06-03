import { NextResponse } from "next/server";

import { requireSession, SessionError } from "@/lib/auth/session";
import {
  BalanceError,
  listBalanceTransactions,
} from "@/lib/balance/service";
import { listBalanceTransactionsQuerySchema } from "@/lib/validation/balance";

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
    const url = new URL(request.url);
    const parsed = listBalanceTransactionsQuerySchema.safeParse(
      Object.fromEntries(url.searchParams.entries())
    );

    if (!parsed.success) {
      return jsonError(400, "VALIDATION_ERROR", "Invalid transaction filters");
    }

    const data = await listBalanceTransactions(session, parsed.data, request);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    if (error instanceof SessionError || error instanceof BalanceError) {
      return jsonError(error.status, error.code, error.message);
    }

    return jsonError(500, "INTERNAL_ERROR", "Unable to load transactions");
  }
}
