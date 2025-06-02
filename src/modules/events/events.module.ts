import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { EventsResolver } from './events.resolver';
import { EventEntity } from './entities/event.entity';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EventEntity]),
    BlockchainModule,
  ],
  controllers: [EventsController],
  providers: [EventsService, EventsResolver],
  exports: [EventsService],
})
export class EventsModule {}
