import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

function messageFromHttpResponseBody(response: string | Record<string, unknown>): string {
  if (typeof response === 'string') {
    return response;
  }
  const raw = response.message;
  if (typeof raw === 'string') {
    return raw;
  }
  if (Array.isArray(raw) && raw.every((m): m is string => typeof m === 'string')) {
    return raw.join(', ');
  }
  return 'An error occurred';
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (!(exception instanceof HttpException)) {
      this.logger.error('Unhandled exception', exception instanceof Error ? exception.stack : exception);
    }

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const body = exception instanceof HttpException ? exception.getResponse() : 'Internal server error';

    const errorResponse =
      typeof body === 'string'
        ? {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            message: body,
          }
        : {
            ...(body as Record<string, unknown>),
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            message: messageFromHttpResponseBody(body as Record<string, unknown>),
          };

    response.status(status).json(errorResponse);
  }
}
