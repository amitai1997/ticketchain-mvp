import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { ApiKeyGuard } from './guards/api-key.guard';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { HealthController } from './controllers/health.controller';
import { DatabaseModule } from '../modules/database/database.module';
import { CacheModule } from '../modules/cache/cache.module';
import { BlockchainModule } from '../modules/blockchain/blockchain.module';

@Module({
  imports: [
    DatabaseModule,
    CacheModule,
    BlockchainModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ApiKeyGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
  controllers: [HealthController],
  exports: [],
})
export class CommonModule {}
