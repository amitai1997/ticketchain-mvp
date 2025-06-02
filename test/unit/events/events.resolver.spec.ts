import { Test, TestingModule } from '@nestjs/testing';
import { EventsResolver } from '../../../src/modules/events/events.resolver';
import { EventsService } from '../../../src/modules/events/events.service';
import { CreateEventInput } from '../../../src/modules/events/graphql/event.inputs';
import { TEST_ARTIST_ADDRESS, TEST_EVENT_REGISTRY_ADDRESS } from '../../test-config';

describe('EventsResolver', () => {
  let resolver: EventsResolver;
  let service: EventsService;

  // Mock the EventsService
  const mockEventsService = {
    createEvent: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsResolver,
        {
          provide: EventsService,
          useValue: mockEventsService,
        },
      ],
    }).compile();

    resolver = module.get<EventsResolver>(EventsResolver);
    service = module.get<EventsService>(EventsService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('getEvents', () => {
    it('should return paginated events', async () => {
      // Arrange
      const page = 1;
      const limit = 10;
      const expectedResult = {
        items: [
          {
            eventId: '123',
            name: 'Test Event',
            date: new Date(),
            venue: 'Test Venue',
          },
        ],
        meta: {
          currentPage: 1,
          itemsPerPage: 10,
          totalItems: 1,
          totalPages: 1,
        },
      };

      mockEventsService.findAll.mockResolvedValue(expectedResult);

      // Act
      const result = await resolver.getEvents(page, limit);

      // Assert
      expect(mockEventsService.findAll).toHaveBeenCalledWith({ page, limit });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getEvent', () => {
    it('should return a single event', async () => {
      // Arrange
      const eventId = '123';
      const expectedResult = {
        eventId,
        name: 'Test Event',
        date: new Date(),
        venue: 'Test Venue',
      };

      mockEventsService.findOne.mockResolvedValue(expectedResult);

      // Act
      const result = await resolver.getEvent(eventId);

      // Assert
      expect(mockEventsService.findOne).toHaveBeenCalledWith(eventId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('createEvent', () => {
    it('should create a new event', async () => {
      // Arrange
      const input: CreateEventInput = {
        name: 'Test Event',
        date: '2023-12-31T20:00:00Z',
        venue: 'Test Venue',
        capacity: 1000,
        royaltyBps: 500,
        maxResalePriceBps: 5000,
        artistAddress: TEST_ARTIST_ADDRESS,
      };

      const expectedResult = {
        eventId: '123',
        contractAddress: TEST_EVENT_REGISTRY_ADDRESS,
        txHash: '0xabc123',
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      mockEventsService.createEvent.mockResolvedValue(expectedResult);

      // Act
      const result = await resolver.createEvent(input);

      // Assert
      expect(mockEventsService.createEvent).toHaveBeenCalledWith(input);
      expect(result).toEqual(expectedResult);
    });
  });
});
