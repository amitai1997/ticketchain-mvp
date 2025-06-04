import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource, Repository, EntityManager, QueryRunner } from 'typeorm';
import { DatabaseService } from '../../../src/modules/database/database.service';
import { suppressAllLogOutput } from '../../utils/suppress-errors';

describe('DatabaseService', () => {
  // Suppress all log output for this test suite
  suppressAllLogOutput();

  let service: DatabaseService;
  let mockDataSource: Partial<DataSource>;
  let mockEntityManager: Partial<EntityManager>;
  let mockQueryRunner: Partial<QueryRunner>;

  beforeEach(async () => {
    mockEntityManager = {
      query: jest.fn(),
      transaction: jest.fn(),
    };

    mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: mockEntityManager as EntityManager,
    };

    mockDataSource = {
      getRepository: jest.fn(),
      manager: mockEntityManager as EntityManager,
      query: jest.fn(),
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
      isInitialized: true,
      options: {
        type: 'postgres' as const,
        database: 'test_db',
      },
      runMigrations: jest.fn(),
      synchronize: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseService,
        {
          provide: getDataSourceToken(),
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<DatabaseService>(DatabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getRepository', () => {
    it('should return a repository for the given entity', () => {
      class TestEntity {}
      const mockRepository = {} as Repository<TestEntity>;

      (mockDataSource.getRepository as jest.Mock).mockReturnValue(mockRepository);

      const result = service.getRepository(TestEntity);

      expect(mockDataSource.getRepository).toHaveBeenCalledWith(TestEntity);
      expect(result).toBe(mockRepository);
    });
  });

  describe('getEntityManager', () => {
    it('should return the entity manager', () => {
      const result = service.getEntityManager();

      expect(result).toBe(mockEntityManager);
    });
  });

  describe('query', () => {
    it('should execute a SQL query successfully', async () => {
      const query = 'SELECT * FROM users';
      const parameters = ['param1', 'param2'];
      const expectedResult = [{ id: 1, name: 'test' }];

      (mockDataSource.query as jest.Mock).mockResolvedValue(expectedResult);

      const result = await service.query(query, parameters);

      expect(mockDataSource.query).toHaveBeenCalledWith(query, parameters);
      expect(result).toEqual(expectedResult);
    });

    it('should handle query execution errors', async () => {
      const query = 'INVALID SQL';
      const error = new Error('SQL syntax error');

      (mockDataSource.query as jest.Mock).mockRejectedValue(error);

      await expect(service.query(query)).rejects.toThrow('SQL syntax error');
    });
  });

  describe('transaction', () => {
    it('should execute a transaction successfully', async () => {
      const expectedResult = { success: true };
      const operation = jest.fn().mockResolvedValue(expectedResult);

      const result = await service.transaction(operation);

      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(operation).toHaveBeenCalledWith(mockQueryRunner.manager);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });

    it('should rollback transaction on error', async () => {
      const error = new Error('Transaction error');
      const operation = jest.fn().mockRejectedValue(error);

      await expect(service.transaction(operation)).rejects.toThrow('Transaction error');

      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(operation).toHaveBeenCalledWith(mockQueryRunner.manager);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status when database is accessible', async () => {
      (mockDataSource.query as jest.Mock).mockResolvedValue([]);

      const result = await service.healthCheck();

      expect(result.status).toBe('healthy');
      expect(result.database).toBe('test_db');
      expect(result.uptime).toBeGreaterThanOrEqual(0);
      expect(mockDataSource.query).toHaveBeenCalledWith('SELECT 1');
    });

    it('should return unhealthy status when database is not accessible', async () => {
      const error = new Error('Connection failed');
      (mockDataSource.query as jest.Mock).mockRejectedValue(error);

      const result = await service.healthCheck();

      expect(result.status).toBe('unhealthy');
      expect(result.database).toBe('test_db');
      expect(result.uptime).toBe(-1);
    });
  });

  describe('getStats', () => {
    it('should return database statistics', async () => {
      // Mock connection count query
      (mockDataSource.query as jest.Mock)
        .mockResolvedValueOnce([{ count: '5' }]) // Connection count
        .mockResolvedValueOnce([{ count: '3' }]); // Migration count

      const result = await service.getStats();

      expect(result).toEqual({
        database: 'test_db',
        connectionCount: 5,
        isConnected: true,
        migrations: 3,
      });
    });

    it('should handle missing query results gracefully', async () => {
      // Mock empty results
      (mockDataSource.query as jest.Mock)
        .mockResolvedValueOnce([]) // Empty connection count
        .mockResolvedValueOnce([]); // Empty migration count

      const result = await service.getStats();

      expect(result).toEqual({
        database: 'test_db',
        connectionCount: 0,
        isConnected: true,
        migrations: 0,
      });
    });
  });

  describe('runMigrations', () => {
    it('should run migrations successfully', async () => {
      (mockDataSource.runMigrations as jest.Mock).mockResolvedValue([]);

      await service.runMigrations();

      expect(mockDataSource.runMigrations).toHaveBeenCalled();
    });

    it('should handle migration errors', async () => {
      const error = new Error('Migration failed');
      (mockDataSource.runMigrations as jest.Mock).mockRejectedValue(error);

      await expect(service.runMigrations()).rejects.toThrow('Migration failed');
    });
  });

  describe('synchronizeSchema', () => {
    it('should synchronize schema successfully', async () => {
      (mockDataSource.synchronize as jest.Mock).mockResolvedValue(undefined);

      await service.synchronizeSchema();

      expect(mockDataSource.synchronize).toHaveBeenCalled();
    });

    it('should handle synchronization errors', async () => {
      const error = new Error('Synchronization failed');
      (mockDataSource.synchronize as jest.Mock).mockRejectedValue(error);

      await expect(service.synchronizeSchema()).rejects.toThrow('Synchronization failed');
    });
  });
});
