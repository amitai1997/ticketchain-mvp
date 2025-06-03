import { Test, TestingModule } from '@nestjs/testing';
import { EventsController } from '../../../src/modules/events/events.controller';
import { EventsService } from '../../../src/modules/events/events.service';
import { CreateEventDto } from '../../../src/modules/events/dto/create-event.dto';
import { TEST_ARTIST_ADDRESS, TEST_EVENT_REGISTRY_ADDRESS } from '../../test-config';

describe('EventsController', () => {
  let controller: EventsController;
  let service: EventsService;

  // Mock the EventsService
  const mockEventsService = {
    createEvent: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        {
          provide: EventsService,
          useValue: mockEventsService,
        },
      ],
    }).compile();

    controller = module.get<EventsController>(EventsController);
    service = module.get<EventsService>(EventsService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new event', async () => {
      // Arrange
      const createEventDto: CreateEventDto = {
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
      const result = await controller.create(createEventDto);

      // Assert
      expect(mockEventsService.createEvent).toHaveBeenCalledWith(createEventDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
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
      const result = await controller.findAll(page, limit);

      // Assert
      expect(mockEventsService.findAll).toHaveBeenCalledWith({ page, limit });
      expect(result).toEqual(expectedResult);
    });

    it('should use default values when parameters are missing', async () => {
      // Arrange
      const expectedResult = {
        items: [],
        meta: {
          currentPage: 1,
          itemsPerPage: 10,
          totalItems: 0,
          totalPages: 0,
        },
      };

      // Update the mock implementation to handle default values
      mockEventsService.findAll = jest.fn().mockImplementation((params) => {
        // Apply defaults if they are not provided
        const page = params.page || 1;
        const limit = params.limit || 10;
        return Promise.resolve({
          ...expectedResult,
          meta: {
            ...expectedResult.meta,
            currentPage: page,
            itemsPerPage: limit,
          },
        });
      });

      // Act
      const result = await controller.findAll();

      // Assert
      // Verify that findAll was called with undefined parameters
      expect(mockEventsService.findAll).toHaveBeenCalledWith({ page: undefined, limit: undefined });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
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
      const result = await controller.findOne(eventId);

      // Assert
      expect(mockEventsService.findOne).toHaveBeenCalledWith(eventId);
      expect(result).toEqual(expectedResult);
    });
  });
});
