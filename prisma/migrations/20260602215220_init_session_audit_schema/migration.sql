-- CreateTable
CREATE TABLE "ResellerSession" (
    "id" TEXT NOT NULL,
    "apiKeyHash" TEXT NOT NULL,
    "encryptedApiKey" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResellerSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "apiKeyHash" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiRequestLog" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "statusCode" INTEGER,
    "durationMs" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL,
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiRequestLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResellerSession_apiKeyHash_idx" ON "ResellerSession"("apiKeyHash");

-- CreateIndex
CREATE INDEX "ResellerSession_expiresAt_idx" ON "ResellerSession"("expiresAt");

-- CreateIndex
CREATE INDEX "ResellerSession_revokedAt_idx" ON "ResellerSession"("revokedAt");

-- CreateIndex
CREATE INDEX "AuditLog_sessionId_idx" ON "AuditLog"("sessionId");

-- CreateIndex
CREATE INDEX "AuditLog_apiKeyHash_idx" ON "AuditLog"("apiKeyHash");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_resourceType_resourceId_idx" ON "AuditLog"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "ApiRequestLog_sessionId_idx" ON "ApiRequestLog"("sessionId");

-- CreateIndex
CREATE INDEX "ApiRequestLog_method_path_idx" ON "ApiRequestLog"("method", "path");

-- CreateIndex
CREATE INDEX "ApiRequestLog_success_idx" ON "ApiRequestLog"("success");

-- CreateIndex
CREATE INDEX "ApiRequestLog_errorCode_idx" ON "ApiRequestLog"("errorCode");

-- CreateIndex
CREATE INDEX "ApiRequestLog_createdAt_idx" ON "ApiRequestLog"("createdAt");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ResellerSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiRequestLog" ADD CONSTRAINT "ApiRequestLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ResellerSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
