-- CreateTable
CREATE TABLE "Presentation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "credentialId" TEXT NOT NULL,
    "credentialType" TEXT NOT NULL,
    "issuerName" TEXT NOT NULL,
    "issuerAddress" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "merkleRoot" TEXT NOT NULL,
    "credentialHash" TEXT NOT NULL,
    "disclosedClaims" TEXT NOT NULL,
    "redactedKeys" TEXT NOT NULL,
    "holderAddress" TEXT NOT NULL,
    "holderSignature" TEXT,
    "purpose" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "issuedAt" DATETIME NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "presentationId" TEXT NOT NULL,
    "verifierIp" TEXT,
    "result" TEXT NOT NULL,
    "latencyMs" INTEGER,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Verification_presentationId_fkey" FOREIGN KEY ("presentationId") REFERENCES "Presentation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConsentLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "holderAddress" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "credentialTitle" TEXT NOT NULL,
    "disclosedClaims" TEXT NOT NULL,
    "redactedClaims" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchId" TEXT NOT NULL,
    "merkleRoot" TEXT NOT NULL,
    "issuerAddress" TEXT NOT NULL,
    "issuerName" TEXT NOT NULL,
    "credentialType" TEXT NOT NULL,
    "totalCredentials" INTEGER NOT NULL,
    "txHash" TEXT NOT NULL,
    "ipfsUri" TEXT NOT NULL DEFAULT '',
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Revocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "credentialHash" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "revokedBy" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Batch_batchId_key" ON "Batch"("batchId");

-- CreateIndex
CREATE UNIQUE INDEX "Revocation_credentialHash_key" ON "Revocation"("credentialHash");
