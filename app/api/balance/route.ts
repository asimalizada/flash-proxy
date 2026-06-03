import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/session";
import { BalanceError, getBalance } from "@/lib/balance/service";

export async function GET() {
  const session = await requireSession();

  try {
    const data = await getBalance(session);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    if (error instanceof BalanceError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: error.status }
      );
    }

    throw error;
  }
}
