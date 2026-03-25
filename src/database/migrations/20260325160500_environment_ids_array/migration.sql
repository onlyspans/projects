-- Convert projects.environment_ids from CSV TEXT to TEXT[]
ALTER TABLE "projects"
  ALTER COLUMN "environment_ids" DROP DEFAULT;

ALTER TABLE "projects"
  ALTER COLUMN "environment_ids" TYPE TEXT[]
  USING (
    CASE
      WHEN "environment_ids" IS NULL OR btrim("environment_ids") = '' THEN ARRAY[]::TEXT[]
      ELSE regexp_split_to_array(btrim("environment_ids"), '\s*,\s*')
    END
  );

-- Remove any accidental empty strings inside the array
UPDATE "projects"
SET "environment_ids" = array_remove("environment_ids", '');

ALTER TABLE "projects"
  ALTER COLUMN "environment_ids" SET DEFAULT ARRAY[]::TEXT[];

