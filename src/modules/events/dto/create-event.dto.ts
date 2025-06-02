import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsISO8601, Min, Max, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class EventMetadataDto {
  @ApiPropertyOptional({ description: 'Event description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Event image URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Event category' })
  @IsOptional()
  @IsString()
  category?: string;
}

export class CreateEventDto {
  @ApiProperty({ description: 'Event name', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Event date in ISO 8601 format' })
  @IsISO8601()
  date: string;

  @ApiProperty({ description: 'Event venue', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  venue: string;

  @ApiProperty({ description: 'Maximum event capacity', minimum: 1, maximum: 100000 })
  @IsNumber()
  @Min(1)
  @Max(100000)
  capacity: number;

  @ApiProperty({ description: 'Royalty basis points (0-1000 = 0-10%)', minimum: 0, maximum: 1000 })
  @IsNumber()
  @Min(0)
  @Max(1000)
  royaltyBps: number;

  @ApiProperty({ description: 'Maximum resale price increase in basis points', minimum: 0, maximum: 1000 })
  @IsNumber()
  @Min(0)
  @Max(1000)
  maxResalePriceBps: number;

  @ApiPropertyOptional({ description: 'Optional artist address for royalties' })
  @IsOptional()
  @IsString()
  artistAddress?: string;

  @ApiPropertyOptional({ description: 'Optional event metadata' })
  @IsOptional()
  @ValidateNested()
  @Type(() => EventMetadataDto)
  metadata?: EventMetadataDto;
}
