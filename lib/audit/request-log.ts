import { prisma } from "@/lib/db/prisma";

export type WriteApiRequestLogInput = {
  sessionId?: string | null;
  method: string;
  path: string;
  statusCode?: number | null;
  durationMs: number;
  success: boolean;
  errorCode?: string | null;
};

export async function writeApiRequestLog(input: WriteApiRequestLogInput) {
  try {
    await prisma.apiRequestLog.create({
      data: {
        sessionId: input.sessionId ?? null,
        method: input.method,
        path: input.path,
        statusCode: input.statusCode ?? null,
        durationMs: input.durationMs,
        success: input.success,
        errorCode: input.errorCode ?? null,
      },
    });
  } catch (error) {
    console.warn("Failed to write API request log", error);
  }
}
