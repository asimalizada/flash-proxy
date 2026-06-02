import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "crypto";

import { getEnv } from "@/lib/env";

const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const ENCRYPTION_VERSION = "v1";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const KEY_DERIVATION_SALT = "flashproxy-api-key-encryption";

function getEncryptionKey() {
  return scryptSync(
    getEnv().API_KEY_ENCRYPTION_SECRET,
    KEY_DERIVATION_SALT,
    KEY_LENGTH
  );
}

export function hashApiKey(apiKey: string) {
  return createHmac("sha256", getEnv().SESSION_SECRET)
    .update(apiKey)
    .digest("hex");
}

export function fingerprintApiKey(apiKeyHash: string) {
  return apiKeyHash.slice(0, 12);
}

export function encryptApiKey(apiKey: string) {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(apiKey, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    ENCRYPTION_VERSION,
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decryptApiKey(encryptedApiKey: string) {
  const [version, encodedIv, encodedAuthTag, encodedValue] =
    encryptedApiKey.split(".");

  if (
    version !== ENCRYPTION_VERSION ||
    !encodedIv ||
    !encodedAuthTag ||
    !encodedValue
  ) {
    throw new Error("Invalid encrypted API key format");
  }

  const iv = Buffer.from(encodedIv, "base64url");
  const authTag = Buffer.from(encodedAuthTag, "base64url");
  const encrypted = Buffer.from(encodedValue, "base64url");

  if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error("Invalid encrypted API key payload");
  }

  const decipher = createDecipheriv(
    ENCRYPTION_ALGORITHM,
    getEncryptionKey(),
    iv
  );
  decipher.setAuthTag(authTag);

  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString("utf8");
}

export function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function secureCompare(left: string, right: string) {
  const leftHash = Buffer.from(hashValue(left), "hex");
  const rightHash = Buffer.from(hashValue(right), "hex");

  return timingSafeEqual(leftHash, rightHash);
}
