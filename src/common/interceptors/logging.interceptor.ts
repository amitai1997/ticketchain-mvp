import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, originalUrl, ip } = request;

    // Generate a unique request ID for tracing
    const requestId = uuidv4();
    (request as any)['requestId'] = requestId;

    const startTime = Date.now();
    const userAgent = request.get('user-agent') || 'unknown';

    this.logger.log(
      `[${requestId}] ${method} ${originalUrl} - START - IP: ${ip}, User-Agent: ${userAgent}`,
    );

    return next
      .handle()
      .pipe(
        tap(() => {
          const response = context.switchToHttp().getResponse<Response>();
          const endTime = Date.now();
          const duration = endTime - startTime;
          const statusCode = response.statusCode;

          this.logger.log(
            `[${requestId}] ${method} ${originalUrl} - ${statusCode} - ${duration}ms`,
          );
        }),
      );
  }
}
