import { randomBytes, randomUUID } from "crypto";

export function createSessionId() {
  return `sess_${randomBytes(32).toString("base64url")}`;
}

export function createIdempotencyKey() {
  return randomUUID();
}

export function createNonce(bytes = 16) {
  return randomBytes(bytes).toString("base64url");
}
