import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketEntity } from './entities/ticket.entity';
import { ListingEntity } from './entities/listing.entity';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TicketEntity, ListingEntity]),
    BlockchainModule,
  ],
  controllers: [], // Will add controllers later
  providers: [],   // Will add services later
  exports: [],     // Will export services later
})
export class MarketplaceModule {}
