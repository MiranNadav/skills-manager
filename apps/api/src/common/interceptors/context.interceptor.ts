import type {
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Injectable } from "@nestjs/common";
import { Observable } from "rxjs";
import { asyncLocalStorage } from "../../core/logger.js";
import { v4 as uuidv4 } from "uuid";
import type { Request } from "express";
import type { LogContext } from "../../core/logger.js";

/**
 * Extracts correlation headers and wraps the request in an
 * AsyncLocalStorage context so all downstream logs include traceId.
 * Must be the FIRST global interceptor.
 */
@Injectable()
export class ContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();

    const traceId =
      (request.headers["x-correlation-id"] as string | undefined) ?? uuidv4();
    const userId = request.headers["x-user-id"] as string | undefined;

    const logContext: LogContext = {
      traceId,
      ...(userId ? { userId } : {}),
    };

    return new Observable((subscriber) => {
      asyncLocalStorage.run(logContext, () => {
        next.handle().subscribe(subscriber);
      });
    });
  }
}
