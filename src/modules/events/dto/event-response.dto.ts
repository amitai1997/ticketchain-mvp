import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EventResponseDto {
  @ApiProperty({ description: 'Event ID (UUID)' })
  eventId: string;

  @ApiProperty({ description: 'Event name' })
  name: string;

  @ApiProperty({ description: 'Event date in ISO 8601 format' })
  date: string;

  @ApiProperty({ description: 'Event venue' })
  venue: string;

  @ApiProperty({ description: 'Maximum event capacity' })
  capacity: number;

  @ApiProperty({ description: 'Number of tickets sold' })
  soldCount: number;

  @ApiProperty({ description: 'Number of tickets available' })
  availableCount: number;

  @ApiProperty({ description: 'Royalty basis points (0-1000 = 0-10%)' })
  royaltyBps: number;

  @ApiProperty({ description: 'Maximum resale price increase in basis points' })
  maxResalePriceBps: number;

  @ApiProperty({ description: 'Contract address on the blockchain' })
  contractAddress: string;

  @ApiProperty({ description: 'Event status (pending, active, cancelled)' })
  status: string;

  @ApiProperty({ description: 'Artist blockchain address' })
  artistAddress: string;

  @ApiPropertyOptional({ description: 'Event metadata' })
  metadata: {
    description?: string;
    imageUrl?: string;
    category?: string;
  };

  @ApiProperty({ description: 'Creation timestamp in ISO 8601 format' })
  createdAt: string;

  @ApiProperty({ description: 'Last update timestamp in ISO 8601 format' })
  updatedAt: string;
}

export class CreateEventResponseDto {
  @ApiProperty({ description: 'Event ID (UUID)' })
  eventId: string;

  @ApiProperty({ description: 'Contract address on the blockchain' })
  contractAddress: string;

  @ApiProperty({ description: 'Transaction hash' })
  txHash: string;

  @ApiProperty({ description: 'Transaction status', enum: ['pending', 'confirmed'] })
  status: 'pending' | 'confirmed';

  @ApiProperty({ description: 'Creation timestamp in ISO 8601 format' })
  createdAt: string;
}
