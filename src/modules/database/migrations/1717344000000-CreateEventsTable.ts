import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateEventsTable1717344000000 implements MigrationInterface {
  name = 'CreateEventsTable1717344000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create events table
    await queryRunner.createTable(
      new Table({
        name: 'events',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'date',
            type: 'timestamp with time zone',
            isNullable: false,
          },
          {
            name: 'venue',
            type: 'varchar',
            length: '200',
            isNullable: false,
          },
          {
            name: 'capacity',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'soldCount',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'royaltyBps',
            type: 'integer',
            isNullable: false,
            comment: 'Royalty in basis points (0-10000)',
          },
          {
            name: 'maxResalePriceBps',
            type: 'integer',
            isNullable: false,
            comment: 'Maximum resale price increase in basis points',
          },
          {
            name: 'artistAddress',
            type: 'varchar',
            length: '42',
            isNullable: true,
            comment: 'Ethereum address for artist royalties',
          },
          {
            name: 'contractAddress',
            type: 'varchar',
            length: '42',
            isNullable: false,
            comment: 'Contract address for this event',
          },
          {
            name: 'chainEventId',
            type: 'integer',
            default: 0,
            isNullable: false,
            comment: 'Event ID on the blockchain',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'pending'",
            isNullable: false,
            comment: 'Event status: pending, active, cancelled',
          },
          {
            name: 'metadata',
            type: 'jsonb',
            default: "'{}'",
            isNullable: false,
            comment: 'Additional event metadata',
          },
          {
            name: 'createdAt',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
        indices: [
          {
            name: 'IDX_events_date',
            columnNames: ['date'],
          },
          {
            name: 'IDX_events_status',
            columnNames: ['status'],
          },
          {
            name: 'IDX_events_chain_event_id',
            columnNames: ['chainEventId'],
          },
          {
            name: 'IDX_events_created_at',
            columnNames: ['createdAt'],
          },
        ],
      }),
      true,
    );

    // Create update trigger for updatedAt
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW."updatedAt" = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_events_updated_at
      BEFORE UPDATE ON events
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop trigger and function
    await queryRunner.query('DROP TRIGGER IF EXISTS update_events_updated_at ON events');
    await queryRunner.query('DROP FUNCTION IF EXISTS update_updated_at_column()');

    // Drop table (indexes will be dropped automatically)
    await queryRunner.dropTable('events');
  }
}
