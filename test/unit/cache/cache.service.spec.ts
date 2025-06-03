import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../../../src/modules/cache/cache.service';

// Mock Redis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    hset: jest.fn(),
    hget: jest.fn(),
    hgetall: jest.fn(),
    expire: jest.fn(),
    exists: jest.fn(),
    keys: jest.fn(),
    incr: jest.fn(),
    incrby: jest.fn(),
    quit: jest.fn(),
  }));
});

describe('CacheService', () => {
  let service: CacheService;
  let mockRedis: any;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, any> = {
        'redis.host': 'localhost',
        'redis.port': 6379,
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
    mockRedis = (service as any).redis;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('set', () => {
    it('should set a value without TTL', async () => {
      const key = 'test-key';
      const value = { data: 'test' };
      
      mockRedis.set.mockResolvedValue('OK');

      await service.set(key, value);

      expect(mockRedis.set).toHaveBeenCalledWith(key, JSON.stringify(value));
      expect(mockRedis.setex).not.toHaveBeenCalled();
    });

    it('should set a value with TTL', async () => {
      const key = 'test-key';
      const value = { data: 'test' };
      const ttl = 300;
      
      mockRedis.setex.mockResolvedValue('OK');

      await service.set(key, value, ttl);

      expect(mockRedis.setex).toHaveBeenCalledWith(key, ttl, JSON.stringify(value));
      expect(mockRedis.set).not.toHaveBeenCalled();
    });

    it('should handle set errors', async () => {
      const key = 'test-key';
      const value = { data: 'test' };
      
      mockRedis.set.mockRejectedValue(new Error('Redis error'));

      await expect(service.set(key, value)).rejects.toThrow('Redis error');
    });
  });

  describe('get', () => {
    it('should get a value and parse JSON', async () => {
      const key = 'test-key';
      const value = { data: 'test' };
      
      mockRedis.get.mockResolvedValue(JSON.stringify(value));

      const result = await service.get(key);

      expect(mockRedis.get).toHaveBeenCalledWith(key);
      expect(result).toEqual(value);
    });

    it('should return null for non-existent key', async () => {
      const key = 'non-existent-key';
      
      mockRedis.get.mockResolvedValue(null);

      const result = await service.get(key);

      expect(result).toBeNull();
    });

    it('should handle get errors gracefully', async () => {
      const key = 'test-key';
      
      mockRedis.get.mockRejectedValue(new Error('Redis error'));

      const result = await service.get(key);

      expect(result).toBeNull();
    });
  });

  describe('del', () => {
    it('should delete a key', async () => {
      const key = 'test-key';
      
      mockRedis.del.mockResolvedValue(1);

      await service.del(key);

      expect(mockRedis.del).toHaveBeenCalledWith(key);
    });

    it('should handle delete errors', async () => {
      const key = 'test-key';
      
      mockRedis.del.mockRejectedValue(new Error('Redis error'));

      await expect(service.del(key)).rejects.toThrow('Redis error');
    });
  });

  describe('hset', () => {
    it('should set a hash field', async () => {
      const key = 'hash-key';
      const field = 'field1';
      const value = { data: 'test' };
      
      mockRedis.hset.mockResolvedValue(1);

      await service.hset(key, field, value);

      expect(mockRedis.hset).toHaveBeenCalledWith(key, field, JSON.stringify(value));
    });
  });

  describe('hget', () => {
    it('should get a hash field value', async () => {
      const key = 'hash-key';
      const field = 'field1';
      const value = { data: 'test' };
      
      mockRedis.hget.mockResolvedValue(JSON.stringify(value));

      const result = await service.hget(key, field);

      expect(mockRedis.hget).toHaveBeenCalledWith(key, field);
      expect(result).toEqual(value);
    });

    it('should return null for non-existent hash field', async () => {
      const key = 'hash-key';
      const field = 'field1';
      
      mockRedis.hget.mockResolvedValue(null);

      const result = await service.hget(key, field);

      expect(result).toBeNull();
    });
  });

  describe('hgetall', () => {
    it('should get all hash fields', async () => {
      const key = 'hash-key';
      const hashData = {
        field1: JSON.stringify({ data: 'test1' }),
        field2: JSON.stringify({ data: 'test2' }),
      };
      
      mockRedis.hgetall.mockResolvedValue(hashData);

      const result = await service.hgetall(key);

      expect(mockRedis.hgetall).toHaveBeenCalledWith(key);
      expect(result).toEqual({
        field1: { data: 'test1' },
        field2: { data: 'test2' },
      });
    });

    it('should handle invalid JSON in hash fields', async () => {
      const key = 'hash-key';
      const hashData = {
        field1: JSON.stringify({ data: 'test1' }),
        field2: 'invalid-json',
      };
      
      mockRedis.hgetall.mockResolvedValue(hashData);

      const result = await service.hgetall(key);

      expect(result).toEqual({
        field1: { data: 'test1' },
        field2: 'invalid-json',
      });
    });
  });

  describe('expire', () => {
    it('should set expiration for a key', async () => {
      const key = 'test-key';
      const ttl = 300;
      
      mockRedis.expire.mockResolvedValue(1);

      await service.expire(key, ttl);

      expect(mockRedis.expire).toHaveBeenCalledWith(key, ttl);
    });
  });

  describe('exists', () => {
    it('should return true if key exists', async () => {
      const key = 'test-key';
      
      mockRedis.exists.mockResolvedValue(1);

      const result = await service.exists(key);

      expect(mockRedis.exists).toHaveBeenCalledWith(key);
      expect(result).toBe(true);
    });

    it('should return false if key does not exist', async () => {
      const key = 'test-key';
      
      mockRedis.exists.mockResolvedValue(0);

      const result = await service.exists(key);

      expect(result).toBe(false);
    });

    it('should handle exists errors gracefully', async () => {
      const key = 'test-key';
      
      mockRedis.exists.mockRejectedValue(new Error('Redis error'));

      const result = await service.exists(key);

      expect(result).toBe(false);
    });
  });

  describe('keys', () => {
    it('should return matching keys', async () => {
      const pattern = 'user:*';
      const keys = ['user:1', 'user:2'];
      
      mockRedis.keys.mockResolvedValue(keys);

      const result = await service.keys(pattern);

      expect(mockRedis.keys).toHaveBeenCalledWith(pattern);
      expect(result).toEqual(keys);
    });

    it('should handle keys errors gracefully', async () => {
      const pattern = 'user:*';
      
      mockRedis.keys.mockRejectedValue(new Error('Redis error'));

      const result = await service.keys(pattern);

      expect(result).toEqual([]);
    });
  });

  describe('incr', () => {
    it('should increment by 1 by default', async () => {
      const key = 'counter';
      
      mockRedis.incr.mockResolvedValue(5);

      const result = await service.incr(key);

      expect(mockRedis.incr).toHaveBeenCalledWith(key);
      expect(result).toBe(5);
    });

    it('should increment by specified amount', async () => {
      const key = 'counter';
      const increment = 5;
      
      mockRedis.incrby.mockResolvedValue(10);

      const result = await service.incr(key, increment);

      expect(mockRedis.incrby).toHaveBeenCalledWith(key, increment);
      expect(result).toBe(10);
    });
  });

  describe('getClient', () => {
    it('should return Redis client', () => {
      const client = service.getClient();
      expect(client).toBe(mockRedis);
    });
  });

  describe('disconnect', () => {
    it('should disconnect from Redis', async () => {
      mockRedis.quit.mockResolvedValue('OK');

      await service.disconnect();

      expect(mockRedis.quit).toHaveBeenCalled();
    });
  });
});
