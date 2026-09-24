-- Move form factor from Site to CruxSnapshot, then unique Site by origin.

-- Add formFactor to snapshots (copy from the parent site for existing rows).
ALTER TABLE "CruxSnapshot" ADD COLUMN "formFactor" "FormFactor";

UPDATE "CruxSnapshot" AS s
SET "formFactor" = site."formFactor"
FROM "Site" AS site
WHERE s."siteId" = site."id";

ALTER TABLE "CruxSnapshot" ALTER COLUMN "formFactor" SET NOT NULL;

-- Merge duplicate origins: keep the oldest Site, reassign snapshots, drop the rest.
WITH ranked AS (
  SELECT
    id,
    origin,
    ROW_NUMBER() OVER (PARTITION BY origin ORDER BY "createdAt" ASC, id ASC) AS rn
  FROM "Site"
),
keepers AS (
  SELECT id, origin FROM ranked WHERE rn = 1
),
dupes AS (
  SELECT ranked.id AS dupe_id, keepers.id AS keep_id
  FROM ranked
  INNER JOIN keepers ON keepers.origin = ranked.origin
  WHERE ranked.rn > 1
)
UPDATE "CruxSnapshot" AS snap
SET "siteId" = dupes.keep_id
FROM dupes
WHERE snap."siteId" = dupes.dupe_id;

WITH ranked AS (
  SELECT
    id,
    origin,
    ROW_NUMBER() OVER (PARTITION BY origin ORDER BY "createdAt" ASC, id ASC) AS rn
  FROM "Site"
)
DELETE FROM "Site"
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- Drop formFactor from Site and unique by origin only.
DROP INDEX "Site_origin_formFactor_key";

ALTER TABLE "Site" DROP COLUMN "formFactor";

CREATE UNIQUE INDEX "Site_origin_key" ON "Site"("origin");
