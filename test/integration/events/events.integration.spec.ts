import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { BlockchainService } from '../../../src/modules/blockchain/blockchain.service';
import { EventsModule } from '../../../src/modules/events/events.module';
import configuration from '../../../src/config/configuration';
import { createTestingApp } from '../../utils/test-app';
import { suppressAllLogOutput } from '../../utils/suppress-errors';
import { TEST_ARTIST_ADDRESS } from '../../test-config';

describe('Events Controller (Integration)', () => {
  // Suppress all log output for this test suite
  suppressAllLogOutput();

  let app: INestApplication;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    // Mock blockchain service
    const mockBlockchainService = {
      getEventRegistryContract: jest.fn().mockImplementation(() => ({
        address: '0x123',
        createEvent: jest.fn().mockResolvedValue({
          hash: '0x123',
          wait: jest.fn().mockResolvedValue({ status: 1 }),
        }),
      })),
      isConnected: jest.fn().mockReturnValue(true),
      getSigner: jest.fn().mockReturnValue({
        address: TEST_ARTIST_ADDRESS,
        getAddress: jest.fn().mockResolvedValue(TEST_ARTIST_ADDRESS),
      }),
    };

    const testApp = await createTestingApp({
      imports: [
        ConfigModule.forRoot({
          load: [configuration],
          isGlobal: true,
        }),
        EventsModule,
      ],
      providers: [
        {
          provide: BlockchainService,
          useValue: mockBlockchainService,
        },
      ],
    });

    app = testApp.app;
    cleanup = testApp.cleanup;
  });

  afterAll(async () => {
    await cleanup();
  });

  describe('/events', () => {
    it('should return an empty array of events', async () => {
      const response = await request(app.getHttpServer()).get('/api/events');
      expect(response.status).toBe(200);
      expect(response.body.items).toBeInstanceOf(Array);
      expect(response.body.items.length).toBe(0);
    });
  });
});
