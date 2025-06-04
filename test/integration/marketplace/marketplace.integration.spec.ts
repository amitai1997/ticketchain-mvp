import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockchainService } from '../../../src/modules/blockchain/blockchain.service';
import { EventEntity } from '../../../src/modules/events/entities/event.entity';
import configuration from '../../../src/config/configuration';
import { createTestingApp } from '../../utils/test-app';
import { suppressAllLogOutput } from '../../utils/suppress-errors';
import { 
  TEST_ARTIST_ADDRESS, 
  TEST_EVENT_REGISTRY_ADDRESS,
  TEST_TICKET_NFT_ADDRESS,
  TEST_MARKETPLACE_ADDRESS 
} from '../../test-config';

// Assuming you have these modules and entities in your project
// If not, you'll need to create or mock them
import { MarketplaceModule } from '../../../src/modules/marketplace/marketplace.module';
import { EventsModule } from '../../../src/modules/events/events.module';
import { TicketEntity } from '../../../src/modules/marketplace/entities/ticket.entity';
import { ListingEntity } from '../../../src/modules/marketplace/entities/listing.entity';

describe('Marketplace Controller (Integration)', () => {
  // Suppress all log output for this test suite
  suppressAllLogOutput();

  let app: INestApplication;
  let cleanup: () => Promise<void>;
  
  // Test user addresses
  const buyer1Address = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
  const buyer2Address = '0x70997970c51812dc3a010c7d01b50e0d17dc79c8';

  beforeAll(async () => {
    // Mock blockchain service
    const mockBlockchainService = {
      getEventRegistryContract: jest.fn().mockImplementation(() => ({
        address: TEST_EVENT_REGISTRY_ADDRESS,
        createEvent: jest.fn().mockResolvedValue({
          hash: '0x123',
          wait: jest.fn().mockResolvedValue({ status: 1 }),
        }),
        getAddress: jest.fn().mockResolvedValue(TEST_EVENT_REGISTRY_ADDRESS),
      })),
      getTicketNFTContract: jest.fn().mockImplementation(() => ({
        address: TEST_TICKET_NFT_ADDRESS,
        mintTicket: jest.fn().mockResolvedValue({
          hash: '0x456',
          wait: jest.fn().mockResolvedValue({ status: 1 }),
        }),
        getAddress: jest.fn().mockResolvedValue(TEST_TICKET_NFT_ADDRESS),
      })),
      getMarketplaceContract: jest.fn().mockImplementation(() => ({
        address: TEST_MARKETPLACE_ADDRESS,
        listTicket: jest.fn().mockResolvedValue({
          hash: '0x789',
          wait: jest.fn().mockResolvedValue({ status: 1 }),
        }),
        buyTicket: jest.fn().mockResolvedValue({
          hash: '0xabc',
          wait: jest.fn().mockResolvedValue({ status: 1 }),
        }),
        getAddress: jest.fn().mockResolvedValue(TEST_MARKETPLACE_ADDRESS),
      })),
      createEvent: jest.fn().mockResolvedValue({
        hash: '0x123',
        wait: jest.fn().mockResolvedValue({ status: 1 }),
      }),
      mintTicket: jest.fn().mockResolvedValue({
        hash: '0x456',
        wait: jest.fn().mockResolvedValue({ status: 1 }),
      }),
      listTicketForSale: jest.fn().mockResolvedValue({
        hash: '0x789',
        wait: jest.fn().mockResolvedValue({ status: 1 }),
      }),
      buyTicket: jest.fn().mockResolvedValue({
        hash: '0xabc',
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
          entities: [EventEntity, TicketEntity, ListingEntity],
          synchronize: true,
          logging: false,
        }),
        EventsModule,
        MarketplaceModule,
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

  // Helper function to create an event for testing
  async function createTestEvent() {
    const createEventDto = {
      name: 'Marketplace Test Event',
      date: '2025-12-31T20:00:00Z',
      venue: 'Test Venue',
      capacity: 1000,
      royaltyBps: 500, // 5%
      maxResalePriceBps: 5000, // 50% max markup
      artistAddress: TEST_ARTIST_ADDRESS,
      metadata: {
        description: 'An event for marketplace tests',
        imageUrl: 'https://example.com/image.jpg',
        category: 'Concert',
      },
    };

    const response = await request(app.getHttpServer())
      .post('/api/events')
      .send(createEventDto);

    return response.body.eventId;
  }

  describe('Ticket minting', () => {
    it('should mint tickets for an event', async () => {
      // Create an event first
      const eventId = await createTestEvent();

      // Mint tickets
      const mintTicketsDto = {
        eventId,
        ownerAddress: TEST_ARTIST_ADDRESS,
        quantity: 5,
        seatNumbers: ['A1', 'A2', 'A3', 'A4', 'A5'],
      };

      const response = await request(app.getHttpServer())
        .post('/api/marketplace/mint')
        .send(mintTicketsDto)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('ticketIds');
      expect(response.body.ticketIds).toHaveLength(5);
      
      // Verify tickets were minted by getting the event tickets
      const ticketsResponse = await request(app.getHttpServer())
        .get(`/api/marketplace/event/${eventId}/tickets`)
        .expect(200);

      expect(ticketsResponse.body.items).toHaveLength(5);
    });
  });

  describe('Ticket listing', () => {
    it('should list a ticket for sale', async () => {
      // Create an event first
      const eventId = await createTestEvent();

      // Mint a ticket
      const mintTicketsDto = {
        eventId,
        ownerAddress: TEST_ARTIST_ADDRESS,
        quantity: 1,
        seatNumbers: ['B1'],
      };

      const mintResponse = await request(app.getHttpServer())
        .post('/api/marketplace/mint')
        .send(mintTicketsDto)
        .expect(201);

      const ticketId = mintResponse.body.ticketIds[0];

      // List the ticket for sale
      const listingDto = {
        ticketId,
        price: 100, // e.g., $100 or 100 wei
        sellerAddress: TEST_ARTIST_ADDRESS,
      };

      const listingResponse = await request(app.getHttpServer())
        .post('/api/marketplace/listings')
        .send(listingDto)
        .expect(201);

      expect(listingResponse.body).toHaveProperty('listingId');
      expect(listingResponse.body).toHaveProperty('ticketId', ticketId);
      expect(listingResponse.body).toHaveProperty('price', 100);
      expect(listingResponse.body).toHaveProperty('status', 'active');

      // Verify the listing by getting all listings
      const listingsResponse = await request(app.getHttpServer())
        .get('/api/marketplace/listings')
        .expect(200);

      expect(listingsResponse.body.items.length).toBeGreaterThan(0);
      const listedTicket = listingsResponse.body.items.find(
        (listing: any) => listing.ticketId === ticketId
      );
      expect(listedTicket).toBeDefined();
      expect(listedTicket.price).toBe(100);
    });
  });

  describe('Ticket purchase', () => {
    it('should purchase a listed ticket', async () => {
      // Create an event first
      const eventId = await createTestEvent();

      // Mint a ticket
      const mintTicketsDto = {
        eventId,
        ownerAddress: TEST_ARTIST_ADDRESS,
        quantity: 1,
        seatNumbers: ['C1'],
      };

      const mintResponse = await request(app.getHttpServer())
        .post('/api/marketplace/mint')
        .send(mintTicketsDto)
        .expect(201);

      const ticketId = mintResponse.body.ticketIds[0];

      // List the ticket for sale
      const listingDto = {
        ticketId,
        price: 100,
        sellerAddress: TEST_ARTIST_ADDRESS,
      };

      const listingResponse = await request(app.getHttpServer())
        .post('/api/marketplace/listings')
        .send(listingDto)
        .expect(201);

      const listingId = listingResponse.body.listingId;

      // Purchase the ticket
      const purchaseDto = {
        listingId,
        buyerAddress: buyer1Address,
      };

      const purchaseResponse = await request(app.getHttpServer())
        .post('/api/marketplace/buy')
        .send(purchaseDto)
        .expect(200);

      expect(purchaseResponse.body).toHaveProperty('success', true);
      expect(purchaseResponse.body).toHaveProperty('transactionHash');

      // Verify the ticket ownership changed by getting the ticket details
      const ticketResponse = await request(app.getHttpServer())
        .get(`/api/marketplace/tickets/${ticketId}`)
        .expect(200);

      expect(ticketResponse.body).toHaveProperty('ownerAddress', buyer1Address);
      expect(ticketResponse.body).toHaveProperty('status', 'owned');
    });

    it('should reject purchase if listing is not active', async () => {
      // Create an event first
      const eventId = await createTestEvent();

      // Mint a ticket
      const mintTicketsDto = {
        eventId,
        ownerAddress: TEST_ARTIST_ADDRESS,
        quantity: 1,
        seatNumbers: ['D1'],
      };

      const mintResponse = await request(app.getHttpServer())
        .post('/api/marketplace/mint')
        .send(mintTicketsDto)
        .expect(201);

      const ticketId = mintResponse.body.ticketIds[0];

      // List the ticket for sale
      const listingDto = {
        ticketId,
        price: 100,
        sellerAddress: TEST_ARTIST_ADDRESS,
      };

      const listingResponse = await request(app.getHttpServer())
        .post('/api/marketplace/listings')
        .send(listingDto)
        .expect(201);

      const listingId = listingResponse.body.listingId;

      // Purchase the ticket
      const purchaseDto1 = {
        listingId,
        buyerAddress: buyer1Address,
      };

      await request(app.getHttpServer())
        .post('/api/marketplace/buy')
        .send(purchaseDto1)
        .expect(200);

      // Try to purchase the same ticket again with a different buyer
      const purchaseDto2 = {
        listingId,
        buyerAddress: buyer2Address,
      };

      await request(app.getHttpServer())
        .post('/api/marketplace/buy')
        .send(purchaseDto2)
        .expect(400); // Should fail with a 400 Bad Request
    });
  });
}); 