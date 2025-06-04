import * as dotenv from 'dotenv';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';

import { AppModule } from '../../src/app.module';
import configuration from '../../src/config/configuration';
import { TEST_CONFIG } from '../test-config';
import { BlockchainService } from '../../src/modules/blockchain/blockchain.service';
import { EventEntity } from '../../src/modules/events/entities/event.entity';

// Load environment variables from .env.test.local file
dotenv.config({ path: '.env.test.local' });

// Ensure we're using the in-memory database for tests
process.env.ENABLE_IN_MEMORY_DB = 'true';

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
    // Set global prefix to match the main application
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('/api/health (GET)', () => {
    it('should return health status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);

      // Check that the response body exists
      expect(response.body).toBeDefined();
      
      // The TransformInterceptor adds data and timestamp to the response
      // But the HealthController already returns { data: {...} }
      // So the actual structure could be either { data: {...} } or { data: { data: {...} } }
      const healthData = response.body.data?.data || response.body.data;
      expect(healthData).toBeDefined();
      
      // Check the health data properties
      expect(healthData.status).toBeDefined();
      expect(healthData.timestamp).toBeDefined();
      expect(healthData.version).toBeDefined();
      expect(healthData.services).toBeDefined();

      // Check services
      expect(healthData.services.database).toBeDefined();
      expect(healthData.services.cache).toBeDefined();
      expect(healthData.services.blockchain).toBeDefined();
      
      // Verify structure of each service
      Object.values(healthData.services).forEach((service: any) => {
        expect(service.status).toBeDefined();
        expect(service.responseTime).toBeDefined();
        expect(service.details).toBeDefined();
      });
    });

    it('should include proper timestamps', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);

      const healthData = response.body.data?.data || response.body.data;
      expect(healthData).toBeDefined();
      
      // Check that timestamp exists and is a string
      const timestamp = healthData.timestamp;
      expect(timestamp).toBeDefined();
      expect(typeof timestamp).toBe('string');
      
      // Timestamp should be a valid date string
      const date = new Date(timestamp);
      expect(isNaN(date.getTime())).toBe(false);
      
      // Timestamp should be recent (within last 10 seconds)
      const now = Date.now();
      const timeDiff = now - date.getTime();
      expect(timeDiff).toBeLessThan(10000);
    });
  });

  describe('/api/health/ready (GET)', () => {
    it('should return readiness status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health/ready')
        .expect(200);

      // Check that the response body exists
      expect(response.body).toBeDefined();
      
      // Access the data field properly, accounting for double wrapping
      const readinessData = response.body.data?.data || response.body.data;
      expect(readinessData).toBeDefined();
      expect(readinessData.ready).toBeDefined();
      expect(typeof readinessData.ready).toBe('boolean');
      
      expect(readinessData.services).toBeDefined();
      expect(Array.isArray(readinessData.services)).toBe(true);

      // Services array should contain service names
      if (readinessData.services.length > 0) {
        readinessData.services.forEach((service: string) => {
          expect(['database', 'cache', 'blockchain']).toContain(service);
        });
      }
    });
  });

  describe('/api/health/live (GET)', () => {
    it('should return liveness status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health/live')
        .expect(200);

      // Check that the response body exists
      expect(response.body).toBeDefined();
      
      // Access the data field properly, accounting for double wrapping
      const livenessData = response.body.data?.data || response.body.data;
      expect(livenessData).toBeDefined();
      expect(livenessData.alive).toBeDefined();
      expect(livenessData.alive).toBe(true);
      
      expect(livenessData.timestamp).toBeDefined();
      expect(typeof livenessData.timestamp).toBe('string');
    });
  });

  describe('Service-specific health checks', () => {
    it('should measure response times', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);

      expect(response.body).toBeDefined();
      
      // Access the data field properly, accounting for double wrapping
      const healthData = response.body.data?.data || response.body.data;
      expect(healthData).toBeDefined();
      
      // Get services data
      const services = healthData.services;
      expect(services).toBeDefined();

      // All response times should be reasonable (< 5 seconds)
      Object.values(services).forEach((service: any) => {
        expect(service.responseTime).toBeLessThan(5000);
        expect(service.responseTime).toBeGreaterThanOrEqual(0);
      });
    });

    it('should provide service details', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);

      expect(response.body).toBeDefined();
      
      // Access the data field properly, accounting for double wrapping
      const healthData = response.body.data?.data || response.body.data;
      expect(healthData).toBeDefined();
      
      // Get services data
      const services = healthData.services;
      expect(services).toBeDefined();

      // Database should have connection details
      if (services.database && services.database.status === 'healthy') {
        expect(services.database.details).toBeDefined();
      }

      // Blockchain should have network details
      if (services.blockchain && services.blockchain.status === 'healthy') {
        expect(services.blockchain.details).toHaveProperty('blockNumber');
      }
    });
  });

  describe('Error conditions', () => {
    it('should handle partial service failures', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200); // Health endpoint should always return 200

      expect(response.body).toBeDefined();
      
      // Access the data field properly, accounting for double wrapping
      const healthData = response.body.data?.data || response.body.data;
      expect(healthData).toBeDefined();
      expect(healthData.status).toBeDefined();
      expect(healthData.services).toBeDefined();
      
      // Get services data
      const services = healthData.services;
      
      // Status should be 'unhealthy' if any service is unhealthy
      const allHealthy = Object.values(services).every(
        (service: any) => service.status === 'healthy'
      );
      
      if (!allHealthy) {
        expect(healthData.status).toBe('unhealthy');
      }
    });
  });
});
