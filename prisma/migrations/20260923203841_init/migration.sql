-- CreateEnum
CREATE TYPE "FormFactor" AS ENUM ('PHONE', 'DESKTOP');

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "formFactor" "FormFactor" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CruxSnapshot" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lcp" DOUBLE PRECISION,
    "inp" DOUBLE PRECISION,
    "cls" DOUBLE PRECISION,
    "collectionPeriod" TEXT NOT NULL,
    "raw" JSONB NOT NULL,

    CONSTRAINT "CruxSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Site_origin_formFactor_key" ON "Site"("origin", "formFactor");

-- CreateIndex
CREATE INDEX "CruxSnapshot_siteId_collectedAt_idx" ON "CruxSnapshot"("siteId", "collectedAt");

-- AddForeignKey
ALTER TABLE "CruxSnapshot" ADD CONSTRAINT "CruxSnapshot_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
