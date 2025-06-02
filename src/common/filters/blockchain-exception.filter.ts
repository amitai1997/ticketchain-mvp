import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

// Custom exception class for blockchain errors
export class BlockchainException extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number = HttpStatus.BAD_REQUEST,
    public readonly details?: any,
  ) {
    super(message);
    this.name = 'BlockchainException';
  }
}

@Catch(BlockchainException)
export class BlockchainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(BlockchainExceptionFilter.name);

  catch(exception: BlockchainException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = {
      error: {
        code: exception.code,
        message: exception.message,
        details: exception.details || null,
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    this.logger.error(
      `Blockchain Error: ${request.method} ${request.url} ${exception.status}: ${JSON.stringify(errorResponse.error)}`,
    );

    response.status(exception.status).json(errorResponse);
  }
}
