import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.get<string>('redis.url');
    if (redisUrl) {
      this.client = new Redis(redisUrl);
      this.client.on('error', (err) =>
        this.logger.error('Redis connection error', err),
      );
      this.client.on('connect', () =>
        this.logger.log('Redis connected'),
      );
    } else {
      // In-memory fallback for development without Redis
      this.logger.warn('No REDIS_URL configured — using in-memory fallback');
      this.client = null as any;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }

  get isConnected(): boolean {
    return !!this.client;
  }

  // ── Slot Locking (5-minute soft lock for booking flow) ──

  async acquireSlotLock(
    workerId: string,
    startTime: string,
    ttlSeconds = 300,
  ): Promise<boolean> {
    if (!this.client) return true; // dev fallback
    const key = `slot_lock:${workerId}:${startTime}`;
    const result = await this.client.set(key, '1', 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }

  async releaseSlotLock(workerId: string, startTime: string): Promise<void> {
    if (!this.client) return;
    const key = `slot_lock:${workerId}:${startTime}`;
    await this.client.del(key);
  }

  async isSlotLocked(workerId: string, startTime: string): Promise<boolean> {
    if (!this.client) return false;
    const key = `slot_lock:${workerId}:${startTime}`;
    const result = await this.client.exists(key);
    return result === 1;
  }

  // ── Rate Limiting ──

  async incrementRateLimit(
    key: string,
    windowSeconds: number,
    maxRequests: number,
  ): Promise<{ allowed: boolean; remaining: number }> {
    if (!this.client) return { allowed: true, remaining: maxRequests };
    const fullKey = `rate_limit:${key}`;
    const current = await this.client.incr(fullKey);
    if (current === 1) {
      await this.client.expire(fullKey, windowSeconds);
    }
    return {
      allowed: current <= maxRequests,
      remaining: Math.max(0, maxRequests - current),
    };
  }

  // ── Generic cache operations ──

  async get(key: string): Promise<string | null> {
    if (!this.client) return null;
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.client) return;
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client) return;
    await this.client.del(key);
  }
}
