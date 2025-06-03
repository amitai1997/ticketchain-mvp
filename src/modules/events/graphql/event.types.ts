import { Field, ObjectType, ID, Int } from '@nestjs/graphql';

@ObjectType({ description: 'Event metadata' })
export class EventMetadataType {
  @Field({ nullable: true, description: 'Event description' })
  description?: string;

  @Field({ nullable: true, description: 'Event image URL' })
  imageUrl?: string;

  @Field({ nullable: true, description: 'Event category' })
  category?: string;
}

@ObjectType({ description: 'Event information' })
export class EventType {
  @Field(() => ID, { description: 'Event ID (UUID)' })
  eventId: string;

  @Field({ description: 'Event name' })
  name: string;

  @Field({ description: 'Event date in ISO 8601 format' })
  date: string;

  @Field({ description: 'Event venue' })
  venue: string;

  @Field(() => Int, { description: 'Maximum event capacity' })
  capacity: number;

  @Field(() => Int, { description: 'Number of tickets sold' })
  soldCount: number;

  @Field(() => Int, { description: 'Number of tickets available' })
  availableCount: number;

  @Field(() => Int, { description: 'Royalty basis points (0-1000 = 0-10%)' })
  royaltyBps: number;

  @Field(() => Int, { description: 'Maximum resale price increase in basis points' })
  maxResalePriceBps: number;

  @Field({ description: 'Contract address on the blockchain' })
  contractAddress: string;

  @Field({ description: 'Event status (pending, active, cancelled)' })
  status: string;

  @Field(() => EventMetadataType, { nullable: true, description: 'Event metadata' })
  metadata?: EventMetadataType;

  @Field({ description: 'Creation timestamp in ISO 8601 format' })
  createdAt: string;

  @Field({ description: 'Last update timestamp in ISO 8601 format' })
  updatedAt: string;
}

@ObjectType({ description: 'Pagination information' })
export class PaginationInfoType {
  @Field(() => Int, { description: 'Total number of items' })
  total: number;

  @Field(() => Int, { description: 'Number of items per page' })
  limit: number;

  @Field(() => Int, { description: 'Starting offset' })
  offset: number;

  @Field({ description: 'Whether there are more items' })
  hasMore: boolean;
}

@ObjectType({ description: 'Paginated events response' })
export class EventPaginationType {
  @Field(() => [EventType], { description: 'List of events' })
  items: EventType[];

  @Field(() => PaginationInfoType, { description: 'Pagination information' })
  pagination: PaginationInfoType;
}

@ObjectType({ description: 'Event creation response' })
export class CreateEventResponseType {
  @Field(() => ID, { description: 'Event ID (UUID)' })
  eventId: string;

  @Field({ description: 'Contract address on the blockchain' })
  contractAddress: string;

  @Field({ description: 'Transaction hash' })
  txHash: string;

  @Field({ description: 'Transaction status', defaultValue: 'pending' })
  status: string;

  @Field({ description: 'Creation timestamp in ISO 8601 format' })
  createdAt: string;
}
