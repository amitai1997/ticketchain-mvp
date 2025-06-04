import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventsService } from '../../../src/modules/events/events.service';
import { EventEntity } from '../../../src/modules/events/entities/event.entity';
import { BlockchainService } from '../../../src/modules/blockchain/blockchain.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateEventDto } from '../../../src/modules/events/dto/create-event.dto';
import { suppressAllLogOutput } from '../../utils/suppress-errors';
import {
  TEST_ARTIST_ADDRESS,
  TEST_EVENT_REGISTRY_ADDRESS
} from '../../test-config';

// Mock the nestjs-typeorm-paginate module
jest.mock('nestjs-typeorm-paginate', () => ({
  paginate: jest.fn(),
}));

import { paginate } from 'nestjs-typeorm-paginate';

// Mock the BlockchainService
const mockBlockchainService = {
  createEvent: jest.fn(),
  getEvent: jest.fn(),
  getSigner: jest.fn(),
  getEventRegistry: jest.fn(),
};

// Mock the Repository
const mockEventRepository = {
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  update: jest.fn(),
  create: jest.fn(),
};

// Mock the EventRegistry contract
const mockEventRegistry = {
  getAddress: jest.fn(),
  setEventActive: jest.fn(),
};

// Mock paginate function
const mockPaginate = paginate as jest.MockedFunction<typeof paginate>;

describe('EventsService', () => {
  // Suppress all log output for this test suite
  suppressAllLogOutput();
  
  let service: EventsService;
  let eventRepository: Repository<EventEntity>;
  let blockchainService: BlockchainService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: getRepositoryToken(EventEntity),
          useValue: mockEventRepository,
        },
        {
          provide: BlockchainService,
          useValue: mockBlockchainService,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    eventRepository = module.get<Repository<EventEntity>>(
      getRepositoryToken(EventEntity),
    );
    blockchainService = module.get<BlockchainService>(BlockchainService);

    // Reset mocks
    mockBlockchainService.getEventRegistry.mockReturnValue(mockEventRegistry);
    mockEventRegistry.getAddress.mockResolvedValue(TEST_EVENT_REGISTRY_ADDRESS);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createEvent', () => {
    it('should create an event successfully', async () => {
      // Arrange
      const createEventDto: CreateEventDto = {
        name: 'Test Event',
        date: '2023-12-31T20:00:00Z',
        venue: 'Test Venue',
        capacity: 1000,
        royaltyBps: 500, // 5%
        maxResalePriceBps: 5000, // 50%
        artistAddress: TEST_ARTIST_ADDRESS,
        metadata: {
          description: 'A test event',
          imageUrl: 'https://example.com/image.jpg',
          category: 'Concert',
        },
      };

      const mockTxResponse = {
        hash: '0x123456789',
        wait: jest.fn().mockResolvedValue({ status: 1 }),
      };

      const mockEventId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      const mockSigner = {
        getAddress: jest.fn().mockResolvedValue('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'),
      };

      // Mock blockchain service
      mockBlockchainService.createEvent.mockResolvedValue(mockTxResponse);
      mockBlockchainService.getSigner.mockReturnValue(mockSigner);

      // Mock repository
      mockEventRepository.create.mockReturnValue({
        id: mockEventId,
        name: createEventDto.name,
        date: new Date(createEventDto.date),
        venue: createEventDto.venue,
        capacity: createEventDto.capacity,
        royaltyBps: createEventDto.royaltyBps,
        maxResalePriceBps: createEventDto.maxResalePriceBps,
        artistAddress: createEventDto.artistAddress,
        metadata: createEventDto.metadata,
      });

      mockEventRepository.save.mockResolvedValue({
        id: mockEventId,
        chainEventId: 0,
        name: createEventDto.name,
        date: new Date(createEventDto.date),
        venue: createEventDto.venue,
        capacity: createEventDto.capacity,
        royaltyBps: createEventDto.royaltyBps,
        maxResalePriceBps: createEventDto.maxResalePriceBps,
        artistAddress: createEventDto.artistAddress,
        contractAddress: TEST_EVENT_REGISTRY_ADDRESS,
        txHash: mockTxResponse.hash,
        status: 'pending',
        metadata: createEventDto.metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await service.createEvent(createEventDto);

      // Assert
      expect(mockBlockchainService.createEvent).toHaveBeenCalledWith(
        createEventDto.name,
        expect.any(Number), // Timestamp
        createEventDto.venue,
        createEventDto.capacity,
        createEventDto.royaltyBps,
        createEventDto.maxResalePriceBps,
        createEventDto.artistAddress,
      );

      expect(mockEventRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: createEventDto.name,
          date: expect.any(Date),
          venue: createEventDto.venue,
          capacity: createEventDto.capacity,
          royaltyBps: createEventDto.royaltyBps,
          maxResalePriceBps: createEventDto.maxResalePriceBps,
          artistAddress: createEventDto.artistAddress,
          status: 'pending',
          metadata: createEventDto.metadata,
        }),
      );

      expect(result).toEqual({
        eventId: mockEventId,
        contractAddress: TEST_EVENT_REGISTRY_ADDRESS,
        txHash: mockTxResponse.hash,
        status: 'pending',
        createdAt: expect.any(String),
      });
    });

    it('should throw BadRequestException when blockchain service fails', async () => {
      // Arrange
      const createEventDto: CreateEventDto = {
        name: 'Test Event',
        date: '2023-12-31T20:00:00Z',
        venue: 'Test Venue',
        capacity: 1000,
        royaltyBps: 500, // 5%
        maxResalePriceBps: 5000, // 50%
        artistAddress: TEST_ARTIST_ADDRESS,
      };

      mockBlockchainService.createEvent.mockRejectedValue(
        new Error('Blockchain error'),
      );

      // Act & Assert
      await expect(service.createEvent(createEventDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated events', async () => {
      // Arrange
      const paginationParams = { page: 1, limit: 10 };
      const mockEvents = [
        {
          id: 'event-1',
          name: 'Event 1',
          date: new Date(),
          venue: 'Venue 1',
          capacity: 100,
          soldCount: 50,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'event-2',
          name: 'Event 2',
          date: new Date(),
          venue: 'Venue 2',
          capacity: 200,
          soldCount: 75,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      const mockCount = 2;

      // Mock the paginate function
      mockPaginate.mockResolvedValue({
        items: mockEvents,
        meta: {
          itemCount: mockEvents.length,
          totalItems: mockCount,
          itemsPerPage: paginationParams.limit,
          totalPages: Math.ceil(mockCount / paginationParams.limit),
          currentPage: paginationParams.page,
        },
      });

      // Act
      const result = await service.findAll(paginationParams);

      // Assert
      expect(mockPaginate).toHaveBeenCalledWith(
        eventRepository,
        { page: paginationParams.page, limit: paginationParams.limit },
        { order: { createdAt: 'DESC' } }
      );
      expect(result).toHaveProperty('items');
      expect(result.items.length).toBe(2);
      expect(result).toHaveProperty('pagination');
      expect(result.pagination.total).toBe(mockCount);
    });
  });

  describe('findOne', () => {
    it('should return an event when it exists', async () => {
      // Arrange
      const eventId = 'event-1';
      const mockEvent = {
        id: eventId,
        name: 'Event 1',
        date: new Date(),
        venue: 'Venue 1',
        capacity: 100,
        soldCount: 50,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockEventRepository.findOne.mockResolvedValue(mockEvent);

      // Act
      const result = await service.findOne(eventId);

      // Assert
      expect(mockEventRepository.findOne).toHaveBeenCalledWith({
        where: { id: eventId },
      });
      expect(result).toHaveProperty('eventId', eventId);
    });

    it('should throw NotFoundException when event does not exist', async () => {
      // Arrange
      const eventId = 'non-existent-event';
      mockEventRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(eventId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should update event status', async () => {
      // Arrange
      const eventId = 'event-1';
      const status = 'active';
      const mockEvent = {
        id: eventId,
        name: 'Event 1',
        date: new Date(),
        venue: 'Venue 1',
        chainEventId: 1, // Already registered on blockchain
        status: 'cancelled',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockEventRepository.findOne.mockResolvedValue(mockEvent);
      mockEventRepository.save.mockResolvedValue({
        ...mockEvent,
        status,
      });

      // Act
      const result = await service.updateStatus(eventId, status);

      // Assert
      expect(mockEventRepository.findOne).toHaveBeenCalledWith({
        where: { id: eventId },
      });
      expect(mockEventRegistry.setEventActive).toHaveBeenCalledWith(
        mockEvent.chainEventId,
        true, // active = true
      );
      expect(mockEventRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: eventId,
          status,
        }),
      );
      expect(result).toHaveProperty('eventId', eventId);
      expect(result).toHaveProperty('status', status);
    });

    it('should throw NotFoundException when event does not exist', async () => {
      // Arrange
      const eventId = 'non-existent-event';
      const status = 'active';

      mockEventRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateStatus(eventId, status)).rejects.toThrow(NotFoundException);
    });
  });
});
