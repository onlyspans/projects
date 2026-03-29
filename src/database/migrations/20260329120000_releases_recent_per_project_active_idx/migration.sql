-- CreateIndex
CREATE INDEX "releases_recent_per_project_active_idx" ON "releases" ("project_id", "created_at" DESC, "id" DESC) WHERE ("deleted_at" IS NULL);
