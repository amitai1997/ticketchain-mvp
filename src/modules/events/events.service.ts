import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { paginate } from 'nestjs-typeorm-paginate';

import { EventEntity } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { BlockchainService } from '../blockchain/blockchain.service';
import { createPaginationOptions, PaginationParams } from '../../common/utils/pagination.util';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @InjectRepository(EventEntity)
    private readonly eventRepository: Repository<EventEntity>,
    private readonly blockchainService: BlockchainService,
  ) {}

  /**
   * Create a new event
   * @param createEventDto Event data
   * @returns Created event
   */
  async createEvent(createEventDto: CreateEventDto): Promise<{
    eventId: string;
    contractAddress: string;
    txHash: string;
    status: 'pending' | 'confirmed';
    createdAt: string;
  }> {
    try {
      // Convert date string to timestamp (seconds)
      const eventDate = new Date(createEventDto.date);
      const timestamp = Math.floor(eventDate.getTime() / 1000);

      // Send blockchain transaction
      const tx = await this.blockchainService.createEvent(
        createEventDto.name,
        timestamp,
        createEventDto.venue,
        createEventDto.capacity,
        createEventDto.royaltyBps,
        createEventDto.maxResalePriceBps,
        createEventDto.artistAddress,
      );

      // Get signer address and contract address safely
      const signer = this.blockchainService.getSigner();
      const signerAddress = signer ? await signer.getAddress() : '';
      const contractAddress = this.blockchainService.getEventRegistry().getAddress();

      // Create local database entry
      const newEvent = this.eventRepository.create({
        name: createEventDto.name,
        date: eventDate,
        venue: createEventDto.venue,
        capacity: createEventDto.capacity,
        soldCount: 0,
        royaltyBps: createEventDto.royaltyBps,
        maxResalePriceBps: createEventDto.maxResalePriceBps,
        artistAddress: createEventDto.artistAddress || signerAddress,
        contractAddress: await contractAddress,
        chainEventId: 0, // Will be updated when transaction is confirmed
        status: 'pending',
        metadata: createEventDto.metadata || {},
      });

      const savedEvent = await this.eventRepository.save(newEvent);

      this.logger.log(`Event created with ID: ${savedEvent.id}, transaction: ${tx.hash}`);

      // Return creation response
      return {
        eventId: savedEvent.id,
        contractAddress: await contractAddress,
        txHash: tx.hash,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to create event: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to create event: ${error.message}`);
    }
  }

  /**
   * Get all events with pagination
   * @param params Pagination parameters
   * @returns Paginated list of events
   */
  async findAll(params: PaginationParams) {
    const { page, limit } = createPaginationOptions(params);

    // Use TypeORM pagination
    const result = await paginate(this.eventRepository, { page, limit }, {
      order: { createdAt: 'DESC' },
    });

    // Map to response format
    return {
      items: result.items.map(event => this.mapEventToResponse(event)),
      pagination: {
        total: result.meta?.totalItems || 0,
        limit: result.meta?.itemsPerPage || limit,
        offset: Math.max(0, (Number(result.meta?.currentPage || 1) - 1) * Number(result.meta?.itemsPerPage || limit)),
        hasMore: (Number(result.meta?.currentPage || 1) * Number(result.meta?.itemsPerPage || limit)) < Number(result.meta?.totalItems || 0),
      },
    };
  }

  /**
   * Get event by ID
   * @param id Event ID
   * @returns Event details
   */
  async findOne(id: string) {
    const event = await this.eventRepository.findOne({ where: { id } });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return this.mapEventToResponse(event);
  }

  /**
   * Update event status
   * @param id Event ID
   * @param status New status
   * @returns Updated event
   */
  async updateStatus(id: string, status: string) {
    // Validate status
    if (!['active', 'cancelled', 'pending'].includes(status)) {
      throw new BadRequestException(`Invalid status: ${status}. Must be one of: active, cancelled, pending`);
    }

    const event = await this.eventRepository.findOne({ where: { id } });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    // Update blockchain if needed
    if (event.chainEventId > 0) {
      // Only update blockchain if event is already registered
      await this.blockchainService.getEventRegistry().setEventActive(event.chainEventId, status === 'active');
    }

    // Update local database
    event.status = status;
    await this.eventRepository.save(event);

    return this.mapEventToResponse(event);
  }

  /**
   * Map entity to response DTO
   * @param event Event entity
   * @returns Formatted response
   */
  private mapEventToResponse(event: EventEntity) {
    const availableCount = event.capacity - event.soldCount;

    return {
      eventId: event.id,
      name: event.name,
      date: event.date.toISOString(),
      venue: event.venue,
      capacity: event.capacity,
      soldCount: event.soldCount,
      availableCount,
      royaltyBps: event.royaltyBps,
      maxResalePriceBps: event.maxResalePriceBps,
      contractAddress: event.contractAddress,
      status: event.status,
      artistAddress: event.artistAddress,
      metadata: event.metadata,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    };
  }
}
