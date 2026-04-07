"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = __importDefault(require("ioredis"));
let RedisService = RedisService_1 = class RedisService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(RedisService_1.name);
        const redisUrl = this.configService.get('redis.url');
        if (redisUrl) {
            this.client = new ioredis_1.default(redisUrl);
            this.client.on('error', (err) => this.logger.error('Redis connection error', err));
            this.client.on('connect', () => this.logger.log('Redis connected'));
        }
        else {
            this.logger.warn('No REDIS_URL configured — using in-memory fallback');
            this.client = null;
        }
    }
    async onModuleDestroy() {
        if (this.client) {
            await this.client.quit();
        }
    }
    get isConnected() {
        return !!this.client;
    }
    async acquireSlotLock(workerId, startTime, ttlSeconds = 300) {
        if (!this.client)
            return true;
        const key = `slot_lock:${workerId}:${startTime}`;
        const result = await this.client.set(key, '1', 'EX', ttlSeconds, 'NX');
        return result === 'OK';
    }
    async releaseSlotLock(workerId, startTime) {
        if (!this.client)
            return;
        const key = `slot_lock:${workerId}:${startTime}`;
        await this.client.del(key);
    }
    async isSlotLocked(workerId, startTime) {
        if (!this.client)
            return false;
        const key = `slot_lock:${workerId}:${startTime}`;
        const result = await this.client.exists(key);
        return result === 1;
    }
    async incrementRateLimit(key, windowSeconds, maxRequests) {
        if (!this.client)
            return { allowed: true, remaining: maxRequests };
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
    async get(key) {
        if (!this.client)
            return null;
        return this.client.get(key);
    }
    async set(key, value, ttlSeconds) {
        if (!this.client)
            return;
        if (ttlSeconds) {
            await this.client.set(key, value, 'EX', ttlSeconds);
        }
        else {
            await this.client.set(key, value);
        }
    }
    async del(key) {
        if (!this.client)
            return;
        await this.client.del(key);
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map