// Jest setup file for NestJS tests
import { jest } from '@jest/globals';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '@nestjs/common';

// Load environment variables from .env.test.local
const envPath = path.resolve(process.cwd(), '.env.test.local');
if (fs.existsSync(envPath)) {
  console.log(`Loading environment from ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.log('No .env.test.local file found');
}

// Set test environment
process.env.NODE_ENV = 'test';

// Store original logger methods
const originalLoggerError = Logger.error;
const originalLoggerWarn = Logger.warn;
const originalLoggerLog = Logger.log;
const originalLoggerDebug = Logger.debug;
const originalLoggerVerbose = Logger.verbose;

// Mock NestJS Logger methods to prevent noisy test output
Logger.error = jest.fn();
Logger.warn = jest.fn();
Logger.log = jest.fn();
Logger.debug = jest.fn();
Logger.verbose = jest.fn();

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Set test timeout
jest.setTimeout(30000);

// Restore original logger methods after all tests
afterAll(() => {
  Logger.error = originalLoggerError;
  Logger.warn = originalLoggerWarn;
  Logger.log = originalLoggerLog;
  Logger.debug = originalLoggerDebug;
  Logger.verbose = originalLoggerVerbose;
});
