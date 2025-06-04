import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../decorators/api-key.decorator';
import { DatabaseService } from '../../modules/database/database.service';
import { CacheService } from '../../modules/cache/cache.service';
import { BlockchainService } from '../../modules/blockchain/blockchain.service';

interface HealthServiceStatus {
  status: 'healthy' | 'unhealthy';
  responseTime: number;
  details?: Record<string, unknown>;
}

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  services: {
    database: HealthServiceStatus;
    cache: HealthServiceStatus;
    blockchain: HealthServiceStatus;
  };
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly cacheService: CacheService,
    private readonly blockchainService: BlockchainService,
  ) {}

  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('ready')
  @Public()
  @ApiOperation({ summary: 'Readiness check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Service readiness status',
  })
  async getReadiness(): Promise<{ ready: boolean; services: string[] }> {
    const services: string[] = [];
    
    try {
      await this.databaseService.healthCheck();
      services.push('database');
    } catch {
      // Database not ready
    }

    try {
      await this.cacheService.get('test');
      services.push('cache');
    } catch {
      // Cache not ready
    }

    try {
      await this.blockchainService.getProvider().getBlockNumber();
      services.push('blockchain');
    } catch {
      // Blockchain not ready
    }

    return {
      ready: services.length === 3,
      services,
    };
  }

  @Get('live')
  @Public()
  @ApiOperation({ summary: 'Liveness check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Service liveness status',
  })
  getLiveness(): { alive: boolean; timestamp: string } {
    return {
      alive: true,
      timestamp: new Date().toISOString(),
    };
  }
}
