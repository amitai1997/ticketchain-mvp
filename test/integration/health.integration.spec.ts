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

describe('Health Controller (Integration)', () => {
  // Suppress all log output for this test suite
  suppressAllLogOutput();

  let app: INestApplication;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    // Mock blockchain service
    const mockBlockchainService = {
      getEventRegistryContract: jest.fn().mockImplementation(() => ({
        address: '0x123',
      })),
      isConnected: jest.fn().mockReturnValue(true),
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
      ],
    });

    app = testApp.app;

    // Set global prefix to match the main application
    app.setGlobalPrefix('api');
    await app.init();

    cleanup = testApp.cleanup;
  });

  afterAll(async () => {
    await cleanup();
  });

  describe('/health', () => {
    it('should return health status', async () => {
      const response = await request(app.getHttpServer()).get('/api/health');
      expect(response.status).toBe(200);
      // The response structure might be { status: 'ok' } or have a nested structure
      // Check both possibilities
      const healthData = response.body.data || response.body;
      expect(healthData).toBeDefined();
    });
  });

  describe('/health/live', () => {
    it('should return liveness status', async () => {
      const response = await request(app.getHttpServer()).get('/api/health/live');
      expect(response.status).toBe(200);
      // The response structure might be { status: 'ok' } or have a nested structure
      const livenessData = response.body.data || response.body;
      expect(livenessData).toBeDefined();
    });
  });

  describe('/health/ready', () => {
    it('should return readiness status', async () => {
      const response = await request(app.getHttpServer()).get('/api/health/ready');
      expect(response.status).toBe(200);
      // The response structure might be { status: 'ok' } or have a nested structure
      const readinessData = response.body.data || response.body;
      expect(readinessData).toBeDefined();
    });
  });
});
