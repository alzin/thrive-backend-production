import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1773682052825 implements MigrationInterface {
    name = 'Migrations1773682052825'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "trial_alternative_time_requests" ("id" character varying NOT NULL, "userId" character varying NOT NULL, "preferredTimes" jsonb NOT NULL, "timeZone" character varying NOT NULL, "submittedAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8c9386143d15f10cc9c324967c2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "trial_alternative_time_requests" ADD CONSTRAINT "FK_1037c2b51f211a6defd695b70b9" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "trial_alternative_time_requests" DROP CONSTRAINT "FK_1037c2b51f211a6defd695b70b9"`);
        await queryRunner.query(`DROP TABLE "trial_alternative_time_requests"`);
    }

}
