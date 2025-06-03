import { Resolver, Query, Mutation, Args, Int, ID } from '@nestjs/graphql';
import { EventsService } from './events.service';
import { EventType, EventPaginationType, CreateEventResponseType } from './graphql/event.types';
import { CreateEventInput } from './graphql/event.inputs';

@Resolver(() => EventType)
export class EventsResolver {
  constructor(private readonly eventsService: EventsService) {}

  @Query(() => EventPaginationType, { name: 'events', description: 'Get events with pagination' })
  async getEvents(
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 }) page?: number,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 10 }) limit?: number,
  ) {
    return this.eventsService.findAll({ page, limit });
  }

  @Query(() => EventType, { name: 'event', description: 'Get event by ID' })
  async getEvent(@Args('id', { type: () => ID }) id: string) {
    return this.eventsService.findOne(id);
  }

  @Mutation(() => CreateEventResponseType, { description: 'Create a new event' })
  async createEvent(@Args('input') input: CreateEventInput) {
    return this.eventsService.createEvent(input);
  }

  @Mutation(() => EventType, { description: 'Update event status' })
  async updateEventStatus(
    @Args('id', { type: () => ID }) id: string,
    @Args('status', { type: () => String }) status: 'active' | 'cancelled',
  ) {
    return this.eventsService.updateStatus(id, status);
  }
}
