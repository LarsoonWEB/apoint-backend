import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface TransformedResponse<T> {
  success: boolean;
  data: T;
  meta?: any;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, TransformedResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<TransformedResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // If the controller already returned a formatted response, pass through
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // If data has a meta property (pagination), extract it
        if (data && typeof data === 'object' && 'meta' in data) {
          const { meta, ...rest } = data as any;
          return {
            success: true,
            data: rest.data || rest,
            meta,
          };
        }

        return {
          success: true,
          data,
        };
      }),
    );
  }
}
