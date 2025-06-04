import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockchainService } from '../../../src/modules/blockchain/blockchain.service';
import { EventsModule } from '../../../src/modules/events/events.module';
import { EventEntity } from '../../../src/modules/events/entities/event.entity';
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
        getAddress: jest.fn().mockResolvedValue('0x1234567890'),
        setEventActive: jest.fn().mockResolvedValue({
          hash: '0x456',
          wait: jest.fn().mockResolvedValue({ status: 1 }),
        }),
      })),
      createEvent: jest.fn().mockResolvedValue({
        hash: '0x123',
        wait: jest.fn().mockResolvedValue({ status: 1 }),
      }),
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
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [EventEntity],
          synchronize: true,
          logging: false,
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

    // Set global prefix to match the main application
    app.setGlobalPrefix('api');
    await app.init();

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

    it('should create a new event', async () => {
      const createEventDto = {
        name: 'Test Concert',
        date: '2025-12-31T20:00:00Z',
        venue: 'Test Venue',
        capacity: 1000,
        royaltyBps: 500,
        maxResalePriceBps: 5000,
        artistAddress: TEST_ARTIST_ADDRESS,
        metadata: {
          description: 'A test concert event',
          imageUrl: 'https://example.com/image.jpg',
          category: 'Concert',
        },
      };

      const response = await request(app.getHttpServer())
        .post('/api/events')
        .send(createEventDto)
        .expect(201);

      expect(response.body).toHaveProperty('eventId');
      expect(response.body).toHaveProperty('txHash');
      expect(response.body).toHaveProperty('status', 'pending');

      // Verify the event was created by fetching the events list
      const listResponse = await request(app.getHttpServer()).get('/api/events');
      expect(listResponse.status).toBe(200);
      expect(listResponse.body.items).toBeInstanceOf(Array);
      expect(listResponse.body.items.length).toBe(1);
      expect(listResponse.body.items[0].name).toBe(createEventDto.name);
    });

    it('should retrieve a specific event by ID', async () => {
      // First create an event
      const createEventDto = {
        name: 'Another Test Event',
        date: '2025-11-15T19:00:00Z',
        venue: 'Another Venue',
        capacity: 500,
        royaltyBps: 300,
        maxResalePriceBps: 4000,
        artistAddress: TEST_ARTIST_ADDRESS,
        metadata: {
          description: 'Another test event',
          imageUrl: 'https://example.com/another-image.jpg',
          category: 'Festival',
        },
      };

      const createResponse = await request(app.getHttpServer())
        .post('/api/events')
        .send(createEventDto)
        .expect(201);

      const eventId = createResponse.body.eventId;

      // Then retrieve it by ID
      const getResponse = await request(app.getHttpServer())
        .get(`/api/events/${eventId}`)
        .expect(200);

      expect(getResponse.body).toHaveProperty('eventId', eventId);
      expect(getResponse.body).toHaveProperty('name', createEventDto.name);
      expect(getResponse.body).toHaveProperty('venue', createEventDto.venue);
      expect(getResponse.body).toHaveProperty('capacity', createEventDto.capacity);
      expect(getResponse.body).toHaveProperty('artistAddress', createEventDto.artistAddress);
    });

    it('should return 404 for non-existent event ID', async () => {
      const nonExistentId = 'non-existent-id';

      await request(app.getHttpServer())
        .get(`/api/events/${nonExistentId}`)
        .expect(404);
    });

    it('should update an event status', async () => {
      // First create an event
      const createEventDto = {
        name: 'Status Update Event',
        date: '2025-10-10T18:00:00Z',
        venue: 'Status Venue',
        capacity: 300,
        royaltyBps: 400,
        maxResalePriceBps: 3000,
        artistAddress: TEST_ARTIST_ADDRESS,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/api/events')
        .send(createEventDto)
        .expect(201);

      const eventId = createResponse.body.eventId;

      // Update the event status
      const updateResponse = await request(app.getHttpServer())
        .patch(`/api/events/${eventId}/status`)
        .send({ status: 'active' })
        .expect(200);

      expect(updateResponse.body).toHaveProperty('eventId', eventId);
      expect(updateResponse.body).toHaveProperty('status', 'active');

      // Verify the status was updated
      const getResponse = await request(app.getHttpServer())
        .get(`/api/events/${eventId}`)
        .expect(200);

      expect(getResponse.body).toHaveProperty('status', 'active');
    });

    it('should return 404 when updating status for non-existent event', async () => {
      const nonExistentId = 'non-existent-id';

      await request(app.getHttpServer())
        .patch(`/api/events/${nonExistentId}/status`)
        .send({ status: 'active' })
        .expect(404);
    });

    it('should reject invalid status values', async () => {
      // First create an event
      const createEventDto = {
        name: 'Invalid Status Event',
        date: '2025-09-05T17:00:00Z',
        venue: 'Invalid Status Venue',
        capacity: 200,
        royaltyBps: 200,
        maxResalePriceBps: 2000,
        artistAddress: TEST_ARTIST_ADDRESS,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/api/events')
        .send(createEventDto)
        .expect(201);

      const eventId = createResponse.body.eventId;

      // Try to update with an invalid status
      await request(app.getHttpServer())
        .patch(`/api/events/${eventId}/status`)
        .send({ status: 'invalid_status' })
        .expect(400);
    });
  });
});
