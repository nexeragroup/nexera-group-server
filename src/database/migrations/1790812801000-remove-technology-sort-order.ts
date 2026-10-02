import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveTechnologySortOrder1790812801000 implements MigrationInterface {
  name = 'RemoveTechnologySortOrder1790812801000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE public.technologies DROP COLUMN "sortOrder"`,
    );
  }

  async down(): Promise<void> {
    throw new Error(
      'Restoring removed sort-order data requires a reviewed manual plan.',
    );
  }
}
