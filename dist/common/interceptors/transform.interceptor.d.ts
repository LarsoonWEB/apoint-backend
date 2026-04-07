import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
export interface TransformedResponse<T> {
    success: boolean;
    data: T;
    meta?: any;
}
export declare class TransformInterceptor<T> implements NestInterceptor<T, TransformedResponse<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<TransformedResponse<T>>;
}
