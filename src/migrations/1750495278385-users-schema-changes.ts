import { MigrationInterface, QueryRunner } from "typeorm";

export class UsersSchemaChanges1750495278385 implements MigrationInterface {
    name = 'UsersSchemaChanges1750495278385'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "UserSubscription" ADD "paymentMethod" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "Product" DROP CONSTRAINT "unique_website_url"`);
        await queryRunner.query(`ALTER TABLE "UserSubscription" DROP COLUMN "status"`);
        await queryRunner.query(`CREATE TYPE "public"."UserSubscription_status_enum" AS ENUM('active', 'expired', 'cancelled', 'pending')`);
        await queryRunner.query(`ALTER TABLE "UserSubscription" ADD "status" "public"."UserSubscription_status_enum" NOT NULL DEFAULT 'pending'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "UserSubscription" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."UserSubscription_status_enum"`);
        await queryRunner.query(`ALTER TABLE "UserSubscription" ADD "status" character varying NOT NULL DEFAULT 'active'`);
        await queryRunner.query(`ALTER TABLE "Product" ADD CONSTRAINT "unique_website_url" UNIQUE ("websiteUrl")`);
        await queryRunner.query(`ALTER TABLE "UserSubscription" DROP COLUMN "paymentMethod"`);
    }

}
