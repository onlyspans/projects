import { MigrationInterface, QueryRunner } from 'typeorm';

export class LifecycleStageToEnvironment1772964931585 implements MigrationInterface {
  name = 'LifecycleStageToEnvironment1772964931585';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "environments"
       (
           "id"          uuid                   NOT NULL DEFAULT uuid_generate_v4(),
           "name"        character varying(255) NOT NULL,
           "description" text,
           "position"    integer                NOT NULL,
           "created_at"  TIMESTAMP              NOT NULL DEFAULT now(),
           "updated_at"  TIMESTAMP              NOT NULL DEFAULT now(),
           "deleted_at"  TIMESTAMP,
           CONSTRAINT "PK_d0e3d6ab13fb851d6bddaa29fff" PRIMARY KEY ("id")
       )`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_env_position_active" ON "environments" ("position") WHERE deleted_at IS NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_env_name_active" ON "environments" ("name") WHERE deleted_at IS NULL`,
    );

    await queryRunner.query(
      `INSERT INTO "environments" ("name", "description", "position")
       VALUES ('development', 'Development environment', 1),
              ('testing', 'Testing environment', 2),
              ('staging', 'Staging environment', 3),
              ('production', 'Production environment', 4)`,
    );

    await queryRunner.query(
      `ALTER TABLE "projects"
          ADD "environment_ids" text NOT NULL DEFAULT ''`,
    );

    await queryRunner.query(`
        UPDATE "projects" p
        SET "environment_ids" = CASE
                                    WHEN trim(COALESCE(p.lifecycle_stages, '')) = '' THEN ''
                                    ELSE COALESCE(
                                            (SELECT string_agg(e.id::text, ',' ORDER BY e.position)
                                             FROM unnest(string_to_array(p.lifecycle_stages, ',')) AS raw(stage_token)
                                                      INNER JOIN environments e ON trim(raw.stage_token) = e.name
                                             WHERE trim(raw.stage_token) != ''
          ),
          ''
        )
            END
    `);

    await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "lifecycle_stages"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "projects"
          ADD "lifecycle_stages" text NOT NULL DEFAULT ''`,
    );

    await queryRunner.query(`
        UPDATE "projects" p
        SET "lifecycle_stages" = CASE
                                     WHEN trim(COALESCE(p.environment_ids, '')) = '' THEN ''
                                     ELSE COALESCE(
                                             (SELECT string_agg(e.name, ',' ORDER BY e.position)
                                              FROM unnest(string_to_array(p.environment_ids, ',')) AS raw(id_token)
                                                       INNER JOIN environments e ON trim(raw.id_token) ::uuid = e.id
                                             WHERE trim(raw.id_token) != ''
          ),
          ''
        )
            END
    `);

    await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "environment_ids"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_env_name_active"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_env_position_active"`);
    await queryRunner.query(`DROP TABLE "environments"`);
  }
}
