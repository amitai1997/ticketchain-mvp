import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { BullModule } from '@nestjs/bull';
import { join } from 'path';

import configuration from './config/configuration';
import { CommonModule } from './common/common.module';
import { BlockchainModule } from './modules/blockchain/blockchain.module';
import { EventsModule } from './modules/events/events.module';
import { DatabaseModule } from './modules/database/database.module';
import { CacheModule } from './modules/cache/cache.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        // Use in-memory SQLite for tests if enabled
        if (process.env.ENABLE_IN_MEMORY_DB === 'true') {
          return {
            type: 'better-sqlite3',
            database: ':memory:',
            entities: [join(__dirname, '**', '*.entity.{ts,js}')],
            synchronize: true,
            logging: configService.get('database.logging'),
          };
        }

        // Default PostgreSQL configuration for production/development
        return {
          type: 'postgres',
          host: configService.get('database.host'),
          port: configService.get('database.port'),
          username: configService.get('database.username'),
          password: configService.get('database.password'),
          database: configService.get('database.name'),
          entities: [join(__dirname, '**', '*.entity.{ts,js}')],
          migrations: [join(__dirname, 'modules/database/migrations/*.{ts,js}')],
          synchronize: configService.get('database.synchronize'),
          logging: configService.get('database.logging'),
          migrationsRun: process.env.NODE_ENV === 'production',
        };
      },
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/graphql/schema.graphql'),
      sortSchema: true,
      playground: process.env.NODE_ENV !== 'production',
      introspection: process.env.NODE_ENV !== 'production',
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('redis.host'),
          port: configService.get('redis.port'),
        },
        defaultJobOptions: {
          attempts: 3,
          removeOnComplete: true,
          removeOnFail: false,
        },
      }),
    }),
    DatabaseModule,
    CacheModule,
    CommonModule,
    BlockchainModule,
    EventsModule,
  ],
})
export class AppModule {}
