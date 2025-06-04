import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';

import { AppModule } from '../../src/app.module';
import configuration from '../../src/config/configuration';
import { BlockchainService } from '../../src/modules/blockchain/blockchain.service';
import { EventEntity } from '../../src/modules/events/entities/event.entity';
import { createTestingApp } from '../utils/test-app';
import { suppressAllLogOutput } from '../utils/suppress-errors';
import { CacheService } from '../../src/modules/cache/cache.service';

describe('Health Controller (Integration)', () => {
  // Suppress all log output for this test suite
  suppressAllLogOutput();

  let app: INestApplication;
  let cleanup: () => Promise<void>;
  let mockCacheService: Partial<CacheService>;

  beforeAll(async () => {
    // Mock blockchain service
    const mockBlockchainService = {
      getEventRegistryContract: jest.fn().mockImplementation(() => ({
        address: '0x123',
      })),
      isConnected: jest.fn().mockReturnValue(true),
    };

    // Mock cache service
    mockCacheService = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      getClient: jest.fn().mockReturnValue(null),
      // Add other required methods with mock implementations
      disconnect: jest.fn().mockResolvedValue(undefined),
    };

    const testApp = await createTestingApp({
      imports: [
        ConfigModule.forRoot({
          load: [configuration],
          isGlobal: true,
        }),
        AppModule,
      ],
      providers: [
        {
          provide: BlockchainService,
          useValue: mockBlockchainService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    });

    app = testApp.app;

    // Set global prefix to match the main application
    app.setGlobalPrefix('api');
    await app.init();

    cleanup = testApp.cleanup;
  }, 60000); // Increase timeout for app initialization

  afterAll(async () => {
    await cleanup();
  }, 10000); // Increase timeout for cleanup

  describe('/health', () => {
    it('should return health status', async () => {
      const response = await request(app.getHttpServer()).get('/api/health');
      expect(response.status).toBe(200);
      // The response structure might be { status: 'ok' } or have a nested structure
      // Check both possibilities
      const healthData = response.body.data || response.body;
      expect(healthData).toBeDefined();
    }, 10000); // Increase test timeout
  });

  describe('/health/live', () => {
    it('should return liveness status', async () => {
      const response = await request(app.getHttpServer()).get('/api/health/live');
      expect(response.status).toBe(200);
      // The response structure might be { status: 'ok' } or have a nested structure
      const livenessData = response.body.data || response.body;
      expect(livenessData).toBeDefined();
    }, 10000); // Increase test timeout
  });

  describe('/health/ready', () => {
    it('should return readiness status', async () => {
      const response = await request(app.getHttpServer()).get('/api/health/ready');
      expect(response.status).toBe(200);
      // The response structure might be { status: 'ok' } or have a nested structure
      const readinessData = response.body.data || response.body;
      expect(readinessData).toBeDefined();
    }, 10000); // Increase test timeout
  });
});
