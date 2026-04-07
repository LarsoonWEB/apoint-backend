import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class RedisService implements OnModuleDestroy {
    private configService;
    private readonly client;
    private readonly logger;
    constructor(configService: ConfigService);
    onModuleDestroy(): Promise<void>;
    get isConnected(): boolean;
    acquireSlotLock(workerId: string, startTime: string, ttlSeconds?: number): Promise<boolean>;
    releaseSlotLock(workerId: string, startTime: string): Promise<void>;
    isSlotLocked(workerId: string, startTime: string): Promise<boolean>;
    incrementRateLimit(key: string, windowSeconds: number, maxRequests: number): Promise<{
        allowed: boolean;
        remaining: number;
    }>;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttlSeconds?: number): Promise<void>;
    del(key: string): Promise<void>;
}
