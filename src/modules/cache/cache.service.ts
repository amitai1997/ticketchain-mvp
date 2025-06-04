import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly redis: Redis;

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get<string>('redis.host'),
      port: this.configService.get<number>('redis.port'),
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    });

    this.redis.on('connect', () => {
      this.logger.log('Connected to Redis');
    });

    this.redis.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
    });
  }

  /**
   * Set a value in cache with optional TTL
   * @param key Cache key
   * @param value Value to store
   * @param ttlSeconds Time to live in seconds
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, serializedValue);
      } else {
        await this.redis.set(key, serializedValue);
      }
      this.logger.debug(`Cached value for key: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to cache value for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get a value from cache
   * @param key Cache key
   * @returns Cached value or null if not found
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (value === null) {
        return null;
      }
      return JSON.parse(value);
    } catch (error) {
      this.logger.error(`Failed to get cached value for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete a value from cache
   * @param key Cache key
   */
  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
      this.logger.debug(`Deleted cache for key: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete cache for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Set a hash value
   * @param key Hash key
   * @param field Hash field
   * @param value Value to store
   */
  async hset(key: string, field: string, value: any): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      await this.redis.hset(key, field, serializedValue);
      this.logger.debug(`Cached hash value for key: ${key}, field: ${field}`);
    } catch (error) {
      this.logger.error(`Failed to cache hash value for key ${key}, field ${field}:`, error);
      throw error;
    }
  }

  /**
   * Get a hash value
   * @param key Hash key
   * @param field Hash field
   * @returns Cached value or null if not found
   */
  async hget<T = any>(key: string, field: string): Promise<T | null> {
    try {
      const value = await this.redis.hget(key, field);
      if (value === null) {
        return null;
      }
      return JSON.parse(value);
    } catch (error) {
      this.logger.error(`Failed to get hash value for key ${key}, field ${field}:`, error);
      return null;
    }
  }

  /**
   * Get all hash values
   * @param key Hash key
   * @returns Hash object or empty object if not found
   */
  async hgetall<T = any>(key: string): Promise<Record<string, T>> {
    try {
      const hash = await this.redis.hgetall(key);
      const result: Record<string, T> = {};

      for (const [field, value] of Object.entries(hash)) {
        try {
          result[field] = JSON.parse(value);
        } catch {
          // If parsing fails, store as string
          result[field] = value as unknown as T;
        }
      }

      return result;
    } catch (error) {
      this.logger.error(`Failed to get all hash values for key ${key}:`, error);
      return {};
    }
  }

  /**
   * Set expiration time for a key
   * @param key Cache key
   * @param ttlSeconds Time to live in seconds
   */
  async expire(key: string, ttlSeconds: number): Promise<void> {
    try {
      await this.redis.expire(key, ttlSeconds);
      this.logger.debug(`Set expiration for key: ${key}, TTL: ${ttlSeconds}s`);
    } catch (error) {
      this.logger.error(`Failed to set expiration for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Check if key exists
   * @param key Cache key
   * @returns True if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Failed to check existence for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get keys matching pattern
   * @param pattern Key pattern (e.g., 'user:*')
   * @returns Array of matching keys
   */
  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.redis.keys(pattern);
    } catch (error) {
      this.logger.error(`Failed to get keys for pattern ${pattern}:`, error);
      return [];
    }
  }

  /**
   * Increment a numeric value
   * @param key Cache key
   * @param increment Increment value (default: 1)
   * @returns New value after increment
   */
  async incr(key: string, increment = 1): Promise<number> {
    try {
      if (increment === 1) {
        return await this.redis.incr(key);
      } else {
        return await this.redis.incrby(key, increment);
      }
    } catch (error) {
      this.logger.error(`Failed to increment key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get Redis client for advanced operations
   * @returns Redis client instance
   */
  getClient(): Redis {
    return this.redis;
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    await this.redis.quit();
    this.logger.log('Disconnected from Redis');
  }
}
