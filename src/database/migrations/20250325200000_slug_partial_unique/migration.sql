-- DropIndex
DROP INDEX IF EXISTS "projects_slug_key";

-- CreateIndex
CREATE UNIQUE INDEX "projects_slug_active_key" ON "projects"("slug") WHERE (deleted_at IS NULL);
