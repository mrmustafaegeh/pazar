import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request & { id?: string }>();
    const incomingTrace = request.headers['traceparent'];
    const requestId =
      (typeof incomingTrace === 'string' ? incomingTrace.split('-')[1] : undefined) ??
      request.id ??
      randomUUID();
    request.id = requestId;

    const { method, url } = request;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        this.logger.log(JSON.stringify({ requestId, method, url, duration }));
      }),
    );
  }
}
