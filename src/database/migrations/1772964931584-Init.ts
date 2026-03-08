import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1772964931584 implements MigrationInterface {
    name = 'Init1772964931584'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "releases" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "project_id" uuid NOT NULL, "version" character varying(50) NOT NULL, "snapshot_id" uuid, "changelog" text, "notes" text, "structure" jsonb NOT NULL DEFAULT '{}', "metadata" jsonb NOT NULL DEFAULT '{}', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_6b6fc2599a5a281dd44a7d64016" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_766526fe9ad126a944c275bcc6" ON "releases" ("project_id", "version") WHERE deleted_at IS NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_7c1713ccb8499b1aba809205ee" ON "releases" ("snapshot_id") WHERE deleted_at IS NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_8571d55e8fb104a8f1ccd5ac0a" ON "releases" ("project_id") WHERE deleted_at IS NULL`);
        await queryRunner.query(`CREATE TABLE "tags" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "description" text, "color" character varying(7), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_d90243459a697eadb8ad56e9092" UNIQUE ("name"), CONSTRAINT "PK_e7dc17249a1148a1970748eda99" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "projects" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "slug" character varying(255) NOT NULL, "description" text, "image_url" character varying(2048), "emoji" character varying(20), "status" character varying(20) NOT NULL DEFAULT 'active', "owner_id" uuid, "lifecycle_stages" text NOT NULL DEFAULT '', "metadata" jsonb NOT NULL DEFAULT '{}', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_96e045ab8b0271e5f5a91eae1ee" UNIQUE ("slug"), CONSTRAINT "PK_6271df0a7aed1d6c0691ce6ac50" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_011975fcda50308d115270b359" ON "projects" ("status") WHERE deleted_at IS NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_517759fbf3676728f902fdd998" ON "projects" ("owner_id") WHERE deleted_at IS NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_377df245f6a2ea03d3c21fb8c5" ON "projects" ("slug") WHERE deleted_at IS NULL`);
        await queryRunner.query(`CREATE TABLE "project_tags" ("project_id" uuid NOT NULL, "tag_id" uuid NOT NULL, CONSTRAINT "PK_df0765dfc14c4d3e39cb79406f9" PRIMARY KEY ("project_id", "tag_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_bc13802855877d708af05b585a" ON "project_tags" ("project_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_1d0f9955e703904ce2245a2738" ON "project_tags" ("tag_id") `);
        await queryRunner.query(`ALTER TABLE "releases" ADD CONSTRAINT "FK_02bc65837f42eebd942c688fb25" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "project_tags" ADD CONSTRAINT "FK_bc13802855877d708af05b585ad" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "project_tags" ADD CONSTRAINT "FK_1d0f9955e703904ce2245a2738a" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "project_tags" DROP CONSTRAINT "FK_1d0f9955e703904ce2245a2738a"`);
        await queryRunner.query(`ALTER TABLE "project_tags" DROP CONSTRAINT "FK_bc13802855877d708af05b585ad"`);
        await queryRunner.query(`ALTER TABLE "releases" DROP CONSTRAINT "FK_02bc65837f42eebd942c688fb25"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1d0f9955e703904ce2245a2738"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bc13802855877d708af05b585a"`);
        await queryRunner.query(`DROP TABLE "project_tags"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_377df245f6a2ea03d3c21fb8c5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_517759fbf3676728f902fdd998"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_011975fcda50308d115270b359"`);
        await queryRunner.query(`DROP TABLE "projects"`);
        await queryRunner.query(`DROP TABLE "tags"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8571d55e8fb104a8f1ccd5ac0a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7c1713ccb8499b1aba809205ee"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_766526fe9ad126a944c275bcc6"`);
        await queryRunner.query(`DROP TABLE "releases"`);
    }

}
