import { Field, InputType, Int } from '@nestjs/graphql';
import { IsString, IsNumber, IsOptional, IsISO8601, Min, Max, MaxLength } from 'class-validator';

@InputType({ description: 'Event metadata input' })
export class EventMetadataInput {
  @Field({ nullable: true, description: 'Event description' })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true, description: 'Event image URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @Field({ nullable: true, description: 'Event category' })
  @IsOptional()
  @IsString()
  category?: string;
}

@InputType({ description: 'Create event input' })
export class CreateEventInput {
  @Field({ description: 'Event name' })
  @IsString()
  @MaxLength(100)
  name: string;

  @Field({ description: 'Event date in ISO 8601 format' })
  @IsISO8601()
  date: string;

  @Field({ description: 'Event venue' })
  @IsString()
  @MaxLength(200)
  venue: string;

  @Field(() => Int, { description: 'Maximum event capacity', defaultValue: 100 })
  @IsNumber()
  @Min(1)
  @Max(100000)
  capacity: number;

  @Field(() => Int, { description: 'Royalty basis points (0-1000 = 0-10%)', defaultValue: 250 })
  @IsNumber()
  @Min(0)
  @Max(1000)
  royaltyBps: number;

  @Field(() => Int, { description: 'Maximum resale price increase in basis points', defaultValue: 500 })
  @IsNumber()
  @Min(0)
  @Max(1000)
  maxResalePriceBps: number;

  @Field({ nullable: true, description: 'Optional artist address for royalties' })
  @IsOptional()
  @IsString()
  artistAddress?: string;

  @Field(() => EventMetadataInput, { nullable: true, description: 'Optional event metadata' })
  @IsOptional()
  metadata?: EventMetadataInput;
}
