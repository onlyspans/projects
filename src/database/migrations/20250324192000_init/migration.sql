-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('active', 'archived', 'suspended');

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "image_url" VARCHAR(2048),
    "emoji" VARCHAR(20),
    "status" "ProjectStatus" NOT NULL DEFAULT 'active',
    "owner_id" UUID,
    "environment_ids" TEXT NOT NULL DEFAULT '',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "color" VARCHAR(7),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_tags" (
    "project_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,

    CONSTRAINT "project_tags_pkey" PRIMARY KEY ("project_id","tag_id")
);

-- CreateTable
CREATE TABLE "releases" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "version" VARCHAR(50) NOT NULL,
    "snapshot_id" UUID,
    "changelog" TEXT,
    "notes" TEXT,
    "structure" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "releases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "environments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "environments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "projects_slug_key" ON "projects"("slug");

-- CreateIndex
CREATE INDEX "projects_owner_active_idx" ON "projects"("owner_id") WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE INDEX "projects_status_active_idx" ON "projects"("status") WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE INDEX "project_tags_project_id_idx" ON "project_tags"("project_id");

-- CreateIndex
CREATE INDEX "project_tags_tag_id_idx" ON "project_tags"("tag_id");

-- CreateIndex
CREATE INDEX "releases_project_active_idx" ON "releases"("project_id") WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE INDEX "releases_snapshot_active_idx" ON "releases"("snapshot_id") WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "releases_project_version_active_key" ON "releases"("project_id", "version") WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "environments_position_active_key" ON "environments"("position") WHERE (deleted_at IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "environments_name_active_key" ON "environments"("name") WHERE (deleted_at IS NULL);

-- AddForeignKey
ALTER TABLE "project_tags" ADD CONSTRAINT "project_tags_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_tags" ADD CONSTRAINT "project_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "releases" ADD CONSTRAINT "releases_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed default environments (catalog; required for project environment_ids and seed data)
INSERT INTO "environments" ("name", "description", "position", "created_at", "updated_at")
VALUES ('development', 'Development environment', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ('testing', 'Testing environment', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ('staging', 'Staging environment', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ('production', 'Production environment', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
