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
@Controller('api/health')
export class HealthController {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly cacheService: CacheService,
    private readonly blockchainService: BlockchainService,
  ) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Service health status',
  })
  async getHealth(): Promise<HealthCheckResponse> {
    const timestamp = new Date().toISOString();
    const version = process.env.npm_package_version || '1.0.0';
    
    // Check database health
    const databaseStart = Date.now();
    let databaseHealth;
    try {
      const dbCheck = await this.databaseService.healthCheck();
      databaseHealth = {
        status: 'healthy' as const,
        responseTime: Date.now() - databaseStart,
        details: dbCheck,
      };
    } catch (error) {
      databaseHealth = {
        status: 'unhealthy' as const,
        responseTime: Date.now() - databaseStart,
        details: { error: (error as Error).message },
      };
    }

    // Check cache health
    const cacheStart = Date.now();
    let cacheHealth;
    try {
      await this.cacheService.set('health-check', { timestamp }, 30);
      const testValue = await this.cacheService.get('health-check');
      cacheHealth = {
        status: testValue ? 'healthy' as const : 'unhealthy' as const,
        responseTime: Date.now() - cacheStart,
        details: { connected: !!testValue },
      };
    } catch (error) {
      cacheHealth = {
        status: 'unhealthy' as const,
        responseTime: Date.now() - cacheStart,
        details: { error: (error as Error).message },
      };
    }

    // Check blockchain health
    const blockchainStart = Date.now();
    let blockchainHealth;
    try {
      const provider = this.blockchainService.getProvider();
      const blockNumber = await provider.getBlockNumber();
      blockchainHealth = {
        status: 'healthy' as const,
        responseTime: Date.now() - blockchainStart,
        details: {
          blockNumber,
          network: provider._network?.name || 'unknown',
        },
      };
    } catch (error) {
      blockchainHealth = {
        status: 'unhealthy' as const,
        responseTime: Date.now() - blockchainStart,
        details: { error: (error as Error).message },
      };
    }

    // Determine overall health
    const allHealthy = [
      databaseHealth.status,
      cacheHealth.status,
      blockchainHealth.status,
    ].every(status => status === 'healthy');

    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp,
      version,
      services: {
        database: databaseHealth,
        cache: cacheHealth,
        blockchain: blockchainHealth,
      },
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
