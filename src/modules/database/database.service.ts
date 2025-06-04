import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository, ObjectLiteral } from 'typeorm';

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Get a repository for an entity
   * @param entity Entity class
   * @returns Repository instance
   */
  getRepository<Entity extends ObjectLiteral>(entity: new () => Entity): Repository<Entity> {
    return this.dataSource.getRepository(entity);
  }

  /**
   * Get the entity manager
   * @returns EntityManager instance
   */
  getEntityManager(): EntityManager {
    return this.dataSource.manager;
  }

  /**
   * Execute a raw SQL query
   * @param query SQL query
   * @param parameters Query parameters
   * @returns Query result
   */
  async query(query: string, parameters?: unknown[]): Promise<unknown> {
    try {
      this.logger.debug(`Executing query: ${query}`);
      return await this.dataSource.query(query, parameters);
    } catch (error) {
      this.logger.error(`Query execution failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Start a database transaction
   * @param operation Transaction operation
   * @returns Transaction result
   */
  async transaction<T>(operation: (manager: EntityManager) => Promise<T>): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await operation(queryRunner.manager);
      await queryRunner.commitTransaction();
      this.logger.debug('Transaction committed successfully');
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Transaction rolled back: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Check database connection health
   * @returns Connection status
   */
  async healthCheck(): Promise<{ status: string; database: string; uptime: number }> {
    try {
      const startTime = Date.now();
      await this.dataSource.query('SELECT 1');
      const uptime = Date.now() - startTime;

      return {
        status: 'healthy',
        database: this.dataSource.options.database as string,
        uptime,
      };
    } catch (error) {
      this.logger.error(`Database health check failed: ${error.message}`);
      return {
        status: 'unhealthy',
        database: this.dataSource.options.database as string,
        uptime: -1,
      };
    }
  }

  /**
   * Get database statistics
   * @returns Database statistics
   */
  async getStats(): Promise<{
    database: string;
    connectionCount: number;
    isConnected: boolean;
    migrations: number;
  }> {
    try {
      const database = this.dataSource.options.database as string;
      const isConnected = this.dataSource.isInitialized;

      // Get connection count (PostgreSQL specific)
      let connectionCount = 0;
      try {
        const result = await this.dataSource.query(
          "SELECT count(*) as count FROM pg_stat_activity WHERE datname = $1",
          [database]
        );
        connectionCount = parseInt(result[0]?.count || '0');
      } catch {
        // Ignore errors for non-PostgreSQL databases
      }

      // Get migration count
      let migrations = 0;
      try {
        const migrationResult = await this.dataSource.query(
          "SELECT count(*) as count FROM typeorm_metadata"
        );
        migrations = parseInt(migrationResult[0]?.count || '0');
      } catch {
        // Table might not exist yet
      }

      return {
        database,
        connectionCount,
        isConnected,
        migrations,
      };
    } catch (error) {
      this.logger.error(`Failed to get database stats: ${error.message}`);
      throw error;
    }
  }

  /**
   * Run pending migrations
   * @returns Migration results
   */
  async runMigrations(): Promise<void> {
    try {
      this.logger.log('Running pending migrations...');
      await this.dataSource.runMigrations();
      this.logger.log('Migrations completed successfully');
    } catch (error) {
      this.logger.error(`Migration failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create database schema (for development)
   * @returns Schema creation result
   */
  async synchronizeSchema(): Promise<void> {
    try {
      this.logger.log('Synchronizing database schema...');
      await this.dataSource.synchronize();
      this.logger.log('Schema synchronization completed');
    } catch (error) {
      this.logger.error(`Schema synchronization failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}
