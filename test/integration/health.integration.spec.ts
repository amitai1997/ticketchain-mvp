import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';

import { AppModule } from '../../src/app.module';
import configuration from '../../src/config/configuration';
import { TEST_CONFIG } from '../test-config';
import { BlockchainService } from '../../src/modules/blockchain/blockchain.service';

// Mock blockchain service for integration tests
class MockBlockchainService {
  async createEvent(
    name: string,
    date: number,
    venue: string,
    capacity: number,
    royaltyBps: number,
    maxResalePriceBps: number,
    artistAddress?: string
  ) {
    return {
      hash: '0x123456789abcdef',
      wait: async () => ({ status: 1 }),
    };
  }

  getProvider() {
    return {
      getBlockNumber: async () => 123456,
      _network: { name: 'hardhat' }
    };
  }
  
  getSigner() {
    return {
      address: '0x123456789abcdef0123456789abcdef01234567',
      getAddress: async () => '0x123456789abcdef0123456789abcdef01234567'
    };
  }
  
  getEventRegistry() {
    return {
      address: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      getAddress: async () => '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      setEventActive: async (eventId: number, isActive: boolean) => ({
        hash: '0xabcdef123456',
        wait: async () => ({ status: 1 })
      })
    };
  }
  
  getTicketNFT() {
    return {
      address: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'
    };
  }
  
  getMarketplace() {
    return {
      address: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0'
    };
  }
  
  async getEvent(eventId: number) {
    return {
      ipfsHash: 'Qm123456789',
      maxSupply: 1000,
      isPaused: false,
      creator: '0x123456789abcdef0123456789abcdef01234567',
      name: 'Test Event',
      date: Date.now(),
      venue: 'Test Venue',
      capacity: 1000,
      royaltyBps: 500,
      maxResalePriceBps: 1000
    };
  }
}

describe('Health Check Integration (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(BlockchainService)
    .useClass(MockBlockchainService)
    .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/health (GET)', () => {
    it('should return health status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);

      // The response is wrapped in a data field
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toMatchObject({
        status: expect.stringMatching(/^(healthy|unhealthy)$/),
        timestamp: expect.any(String),
        version: expect.any(String),
        services: {
          database: {
            status: expect.stringMatching(/^(healthy|unhealthy)$/),
            responseTime: expect.any(Number),
            details: expect.any(Object),
          },
          cache: {
            status: expect.stringMatching(/^(healthy|unhealthy)$/),
            responseTime: expect.any(Number),
            details: expect.any(Object),
          },
          blockchain: {
            status: expect.stringMatching(/^(healthy|unhealthy)$/),
            responseTime: expect.any(Number),
            details: expect.any(Object),
          },
        },
      });
    });

    it('should include proper timestamps', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);

      const timestamp = new Date(response.body.data.timestamp);
      expect(timestamp.getTime()).not.toBeNaN();
      
      // Timestamp should be recent (within last 10 seconds)
      const now = Date.now();
      const timeDiff = now - timestamp.getTime();
      expect(timeDiff).toBeLessThan(10000);
    });
  });

  describe('/api/health/ready (GET)', () => {
    it('should return readiness status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health/ready')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toMatchObject({
        ready: expect.any(Boolean),
        services: expect.any(Array),
      });

      // Services array should contain service names
      response.body.data.services.forEach((service: string) => {
        expect(['database', 'cache', 'blockchain']).toContain(service);
      });
    });
  });

  describe('/api/health/live (GET)', () => {
    it('should return liveness status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health/live')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toMatchObject({
        alive: true,
        timestamp: expect.any(String),
      });
    });
  });

  describe('Service-specific health checks', () => {
    it('should measure response times', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);

      // All response times should be reasonable (< 5 seconds)
      Object.values(response.body.data.services).forEach((service: any) => {
        expect(service.responseTime).toBeLessThan(5000);
        expect(service.responseTime).toBeGreaterThanOrEqual(0);
      });
    });

    it('should provide service details', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);

      // Database should have connection details
      if (response.body.data.services.database.status === 'healthy') {
        expect(response.body.data.services.database.details).toHaveProperty('database');
      }

      // Blockchain should have network details
      if (response.body.data.services.blockchain.status === 'healthy') {
        expect(response.body.data.services.blockchain.details).toHaveProperty('blockNumber');
      }
    });
  });

  describe('Error conditions', () => {
    it('should handle partial service failures', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200); // Health endpoint should always return 200

      // Even if some services are unhealthy, response should be well-formed
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('services');
      
      // Status should be 'unhealthy' if any service is unhealthy
      const allHealthy = Object.values(response.body.data.services).every(
        (service: any) => service.status === 'healthy'
      );
      
      if (!allHealthy) {
        expect(response.body.data.status).toBe('unhealthy');
      }
    });
  });
});
