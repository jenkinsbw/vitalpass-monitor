-- One snapshot is a save of origin and home, for phone and desktop.

CREATE TYPE "CruxScope" AS ENUM ('ORIGIN', 'HOME');

CREATE TABLE "Snapshot" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Snapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CruxRecord" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "scope" "CruxScope" NOT NULL,
    "formFactor" "FormFactor" NOT NULL,
    "url" TEXT,
    "lcp" DOUBLE PRECISION,
    "inp" DOUBLE PRECISION,
    "cls" DOUBLE PRECISION,
    "collectionPeriod" TEXT,
    "error" TEXT,
    "raw" JSONB,

    CONSTRAINT "CruxRecord_pkey" PRIMARY KEY ("id")
);

-- Group existing origin rows that were saved together.
INSERT INTO "Snapshot" ("id", "siteId", "collectedAt")
SELECT MIN("id"), "siteId", "collectedAt"
FROM "CruxSnapshot"
GROUP BY "siteId", "collectedAt";

INSERT INTO "CruxRecord" (
    "id",
    "snapshotId",
    "scope",
    "formFactor",
    "lcp",
    "inp",
    "cls",
    "collectionPeriod",
    "raw"
)
SELECT DISTINCT ON (s."id", c."formFactor")
    c."id",
    s."id",
    'ORIGIN'::"CruxScope",
    c."formFactor",
    c."lcp",
    c."inp",
    c."cls",
    c."collectionPeriod",
    c."raw"
FROM "CruxSnapshot" AS c
INNER JOIN "Snapshot" AS s
    ON s."siteId" = c."siteId"
    AND s."collectedAt" = c."collectedAt"
ORDER BY s."id", c."formFactor", c."id";

DROP TABLE "CruxSnapshot";

CREATE INDEX "Snapshot_siteId_collectedAt_idx" ON "Snapshot"("siteId", "collectedAt");

CREATE UNIQUE INDEX "CruxRecord_snapshotId_scope_formFactor_key" ON "CruxRecord"("snapshotId", "scope", "formFactor");

ALTER TABLE "Snapshot" ADD CONSTRAINT "Snapshot_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CruxRecord" ADD CONSTRAINT "CruxRecord_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "Snapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
