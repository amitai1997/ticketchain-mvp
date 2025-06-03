import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY } from '../decorators/api-key.decorator';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if the endpoint is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-api-key'] as string;
    const expectedApiKey = this.configService.get<string>('apiKey');

    if (!apiKey) {
      this.logger.warn(`API key missing for ${request.method} ${request.url}`);
      throw new UnauthorizedException({
        code: 'MISSING_API_KEY',
        message: 'API key is required',
      });
    }

    if (apiKey !== expectedApiKey) {
      this.logger.warn(`Invalid API key provided for ${request.method} ${request.url}`);
      throw new UnauthorizedException({
        code: 'INVALID_API_KEY',
        message: 'Invalid API key',
      });
    }

    return true;
  }
}
