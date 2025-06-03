import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';

export interface ResponseData<T> {
  data: T;
  timestamp: string;
  requestId?: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ResponseData<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseData<T>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse<Response>();

    // Skip transformation for file downloads or special responses
    if (response.getHeader('Content-Disposition') || request.query.raw === 'true') {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        // If data is null or undefined, convert to empty object
        const responseData = data === null || data === undefined ? {} : data;

        // If data is already in our format, return it as is
        if (responseData && responseData.data && responseData.timestamp) {
          return responseData;
        }

        // Return standardized format
        return {
          data: responseData,
          timestamp: new Date().toISOString(),
          requestId: request.requestId,
        };
      }),
    );
  }
}
