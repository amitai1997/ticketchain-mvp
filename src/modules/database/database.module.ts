import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DatabaseService } from './database.service';

@Module({
  imports: [ConfigModule, TypeOrmModule],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
