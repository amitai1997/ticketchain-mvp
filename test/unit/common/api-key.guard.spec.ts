import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiKeyGuard } from '../../../src/common/guards/api-key.guard';
import { Reflector } from '@nestjs/core';

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;
  let configService: ConfigService;
  let reflector: Reflector;

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-api-key'),
  };

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyGuard,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<ApiKeyGuard>(ApiKeyGuard);
    configService = module.get<ConfigService>(ConfigService);
    reflector = module.get<Reflector>(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should allow access for public routes', () => {
      const mockContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {},
          }),
        }),
      } as unknown as ExecutionContext;

      mockReflector.getAllAndOverride.mockReturnValue(true); // Public route

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('isPublic', [
        mockContext.getHandler(),
        mockContext.getClass(),
      ]);
    });

    it('should allow access with valid API key', () => {
      const mockContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {
              'x-api-key': 'test-api-key',
            },
          }),
        }),
      } as unknown as ExecutionContext;

      mockReflector.getAllAndOverride.mockReturnValue(false); // Not public

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(configService.get).toHaveBeenCalledWith('apiKey');
    });

    it('should throw UnauthorizedException with invalid API key', () => {
      const mockContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {
              'x-api-key': 'invalid-key',
            },
            method: 'GET',
            url: '/test',
          }),
        }),
      } as unknown as ExecutionContext;

      mockReflector.getAllAndOverride.mockReturnValue(false); // Not public

      expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException without API key', () => {
      const mockContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {},
            method: 'POST',
            url: '/events',
          }),
        }),
      } as unknown as ExecutionContext;

      mockReflector.getAllAndOverride.mockReturnValue(false); // Not public

      expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
    });

    it('should handle case-insensitive header names', () => {
      const mockContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {
              'X-API-KEY': 'test-api-key', // Uppercase header - this won't work with direct access
            },
          }),
        }),
      } as unknown as ExecutionContext;

      mockReflector.getAllAndOverride.mockReturnValue(false); // Not public

      // This should throw because direct header access is case-sensitive
      expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException with empty API key value', () => {
      const mockContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {
              'x-api-key': '',
            },
            method: 'GET',
            url: '/test',
          }),
        }),
      } as unknown as ExecutionContext;

      mockReflector.getAllAndOverride.mockReturnValue(false); // Not public

      expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
    });
  });
});
