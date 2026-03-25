-- Add optional color to environments (hex format, e.g. #FF5733)
ALTER TABLE "environments"
  ADD COLUMN "color" VARCHAR(7);

