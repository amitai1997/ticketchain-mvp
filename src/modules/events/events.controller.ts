import { Controller, Get, Post, Body, Param, Query, Patch, HttpStatus, HttpCode, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';

import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { EventResponseDto, CreateEventResponseDto } from './dto/event-response.dto';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({
    status: 201,
    description: 'Event created successfully',
    type: CreateEventResponseDto,
  })
  async create(@Body() createEventDto: CreateEventDto): Promise<CreateEventResponseDto> {
    return this.eventsService.createEvent(createEventDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all events with pagination' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page' })
  @ApiResponse({
    status: 200,
    description: 'List of events',
    type: [EventResponseDto],
  })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.eventsService.findAll({ page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({
    status: 200,
    description: 'Event found',
    type: EventResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async findOne(@Param('id') id: string): Promise<EventResponseDto> {
    return this.eventsService.findOne(id);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update event status' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({
    status: 200,
    description: 'Event status updated',
    type: EventResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({ status: 400, description: 'Invalid status value' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ): Promise<EventResponseDto> {
    const validStatuses = ['active', 'pending', 'cancelled'];
    if (!validStatuses.includes(body.status)) {
      throw new BadRequestException(`Status must be one of: ${validStatuses.join(', ')}`);
    }
    return this.eventsService.updateStatus(id, body.status);
  }
}
