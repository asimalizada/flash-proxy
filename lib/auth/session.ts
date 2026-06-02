import "server-only";

import { prisma } from "@/lib/db/prisma";
import {
  decryptApiKey,
  encryptApiKey,
  fingerprintApiKey,
  hashApiKey,
} from "@/lib/auth/crypto";
import {
  clearSessionCookie,
  getSessionCookie,
  SESSION_TTL_DAYS,
  setSessionCookie,
} from "@/lib/auth/cookies";
import { createSessionId } from "@/lib/auth/tokens";
import { getRequestContext } from "@/lib/audit/context";

export type AuthenticatedSession = {
  id: string;
  apiKey: string;
  apiKeyHash: string;
  apiKeyFingerprint: string;
  expiresAt: Date;
};

export type CreateResellerSessionInput = {
  apiKey: string;
  request: Request;
};

export class SessionError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 401) {
    super(message);
    this.name = "SessionError";
    this.code = code;
    this.status = status;
  }
}

function getSessionExpiry() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS);
  return expiresAt;
}

export async function createResellerSession({
  apiKey,
  request,
}: CreateResellerSessionInput) {
  const context = getRequestContext(request);
  const apiKeyHash = hashApiKey(apiKey);
  const expiresAt = getSessionExpiry();

  const session = await prisma.resellerSession.create({
    data: {
      id: createSessionId(),
      apiKeyHash,
      encryptedApiKey: encryptApiKey(apiKey),
      expiresAt,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      lastSeenAt: new Date(),
    },
  });

  await setSessionCookie(session.id, expiresAt);

  return {
    id: session.id,
    apiKeyHash,
    apiKeyFingerprint: fingerprintApiKey(apiKeyHash),
    expiresAt,
  };
}

export async function getCurrentSession(): Promise<AuthenticatedSession | null> {
  const sessionId = await getSessionCookie();

  if (!sessionId) {
    return null;
  }

  const session = await prisma.resellerSession.findUnique({
    where: { id: sessionId },
  });

  if (!session || session.revokedAt || session.expiresAt <= new Date()) {
    return null;
  }

  await prisma.resellerSession.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() },
  });

  return {
    id: session.id,
    apiKey: decryptApiKey(session.encryptedApiKey),
    apiKeyHash: session.apiKeyHash,
    apiKeyFingerprint: fingerprintApiKey(session.apiKeyHash),
    expiresAt: session.expiresAt,
  };
}

export async function requireSession() {
  const session = await getCurrentSession();

  if (!session) {
    throw new SessionError("UNAUTHENTICATED", "Authentication is required");
  }

  return session;
}

export async function revokeCurrentSession() {
  const sessionId = await getSessionCookie();

  if (sessionId) {
    await prisma.resellerSession.updateMany({
      where: {
        id: sessionId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  await clearSessionCookie();
}
