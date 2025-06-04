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
  @Public()
  @ApiOperation({ summary: 'Comprehensive health check' })
  @ApiResponse({
    status: 200,
    description: 'Complete health status with service details',
  })
  async check(): Promise<{ data: HealthCheckResponse }> {
    const startTime = Date.now();
    let dbStatus: HealthServiceStatus = {
      status: 'unhealthy',
      responseTime: 0,
      details: {}
    };
    
    try {
      const dbStartTime = Date.now();
      const healthCheck = await this.databaseService.healthCheck();
      dbStatus = {
        status: 'healthy',
        responseTime: Date.now() - dbStartTime,
        details: {
          database: healthCheck.database || 'postgres',
          connected: true
        }
      };
    } catch (error) {
      dbStatus = {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        details: {
          error: error.message,
          connected: false
        }
      };
    }

    const cacheStartTime = Date.now();
    let cacheStatus: HealthServiceStatus = {
      status: 'unhealthy',
      responseTime: 0,
      details: {}
    };
    
    try {
      await this.cacheService.get('test-key');
      cacheStatus = {
        status: 'healthy',
        responseTime: Date.now() - cacheStartTime,
        details: {
          type: 'redis',
          connected: true
        }
      };
    } catch (error) {
      cacheStatus = {
        status: 'unhealthy',
        responseTime: Date.now() - cacheStartTime,
        details: {
          error: error.message,
          connected: false
        }
      };
    }

    const blockchainStartTime = Date.now();
    let blockchainStatus: HealthServiceStatus = {
      status: 'unhealthy',
      responseTime: 0,
      details: {}
    };
    
    try {
      const provider = this.blockchainService.getProvider();
      const blockNumber = await provider.getBlockNumber();
      const network = provider._network?.name || 'unknown';

      blockchainStatus = {
        status: 'healthy',
        responseTime: Date.now() - blockchainStartTime,
        details: {
          network,
          blockNumber,
          connected: true
        }
      };
    } catch (error) {
      blockchainStatus = {
        status: 'unhealthy',
        responseTime: Date.now() - blockchainStartTime,
        details: {
          error: error.message,
          connected: false
        }
      };
    }

    // Overall health status is healthy if all services are healthy
    const overallStatus = 
      dbStatus.status === 'healthy' &&
      cacheStatus.status === 'healthy' &&
      blockchainStatus.status === 'healthy'
        ? 'healthy'
        : 'unhealthy';

    return {
      data: {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        services: {
          database: dbStatus,
          cache: cacheStatus,
          blockchain: blockchainStatus
        }
      }
    };
  }

  @Get('ready')
  @Public()
  @ApiOperation({ summary: 'Readiness check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Service readiness status',
  })
  async getReadiness(): Promise<{ data: { ready: boolean; services: string[] } }> {
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
      data: {
        ready: services.length === 3,
        services,
      }
    };
  }

  @Get('live')
  @Public()
  @ApiOperation({ summary: 'Liveness check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Service liveness status',
  })
  getLiveness(): { data: { alive: boolean; timestamp: string } } {
    return {
      data: {
        alive: true,
        timestamp: new Date().toISOString(),
      }
    };
  }
}
