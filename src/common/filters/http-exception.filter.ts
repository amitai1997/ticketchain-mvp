import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as any;

    const errorResponse = {
      error: {
        code: exceptionResponse.code || this.mapStatusToErrorCode(status),
        message: exceptionResponse.message || exception.message,
        details: exceptionResponse.details || null,
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    this.logger.error(
      `${request.method} ${request.url} ${status}: ${JSON.stringify(errorResponse.error)}`,
    );

    response.status(status).json(errorResponse);
  }

  private mapStatusToErrorCode(status: number): string {
    const statusMap = {
      [HttpStatus.BAD_REQUEST]: 'INVALID_REQUEST',
      [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
      [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
      [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
      [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMITED',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_SERVER_ERROR',
    } as const;

    return statusMap[status as keyof typeof statusMap] || 'UNKNOWN_ERROR';
  }
}
