import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';
    let details: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();

      if (typeof exResponse === 'string') {
        message = exResponse;
      } else if (typeof exResponse === 'object') {
        const obj = exResponse as any;
        message = obj.message || message;
        code = obj.code || code;
        details = obj.details;

        // Handle class-validator errors
        if (Array.isArray(obj.message)) {
          code = 'VALIDATION_ERROR';
          details = obj.message;
          message = 'Validation failed';
        }
      }

      // Map status codes to error codes
      if (code === 'INTERNAL_ERROR') {
        switch (status) {
          case 400:
            code = 'BAD_REQUEST';
            break;
          case 401:
            code = 'UNAUTHORIZED';
            break;
          case 403:
            code = 'FORBIDDEN';
            break;
          case 404:
            code = 'NOT_FOUND';
            break;
          case 409:
            code = 'CONFLICT';
            break;
          case 429:
            code = 'RATE_LIMIT_EXCEEDED';
            break;
        }
      }
    } else {
      this.logger.error('Unhandled exception', exception);
    }

    response.status(status).json({
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
      },
    });
  }
}
