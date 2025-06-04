/**
 * Utility functions to suppress expected errors in tests
 */

import { Logger } from '@nestjs/common';

/**
 * Mock NestJS Logger to suppress expected errors during tests
 * Usage: mockLoggerForTest(ServiceClass.prototype);
 *
 * @param prototype - The prototype of the class containing logger
 */
export function mockLoggerForTest(prototype: any): void {
  // Save the original logger methods
  const originalLoggerError = Logger.error;
  const originalLoggerWarn = Logger.warn;

  // Mock the logger methods to prevent console output during tests
  Logger.error = jest.fn();
  Logger.warn = jest.fn();

  // Restore original methods after tests
  afterAll(() => {
    Logger.error = originalLoggerError;
    Logger.warn = originalLoggerWarn;
  });
}

/**
 * Create a spy on a service's logger to prevent error messages in test output
 * Usage: silenceServiceErrors(serviceInstance);
 *
 * @param service - The service instance containing logger
 */
export function silenceServiceErrors(service: any): void {
  if (service.logger) {
    jest.spyOn(service.logger, 'error').mockImplementation(() => {});
    jest.spyOn(service.logger, 'warn').mockImplementation(() => {});
  }
}

/**
 * Helper to suppress all NestJS Logger output during a test block
 * Usage:
 *
 * describe('My tests', () => {
 *   suppressAllLogOutput();
 *
 *   it('should not show errors', () => {
 *     // Test that triggers errors but won't output them
 *   });
 * });
 */
export function suppressAllLogOutput(): void {
  let originalConsole: any;
  let originalLogger: any;

  beforeAll(() => {
    // Save original console methods
    originalConsole = { ...console };
    // Save original Logger methods
    originalLogger = {
      error: Logger.error,
      warn: Logger.warn,
      log: Logger.log,
      debug: Logger.debug,
      verbose: Logger.verbose,
    };

    // Silence console output
    console.error = jest.fn();
    console.warn = jest.fn();

    // Silence Logger output
    Logger.error = jest.fn();
    Logger.warn = jest.fn();
    Logger.log = jest.fn();
    Logger.debug = jest.fn();
    Logger.verbose = jest.fn();
  });

  afterAll(() => {
    // Restore original console methods
    Object.assign(console, originalConsole);

    // Restore original Logger methods
    Logger.error = originalLogger.error;
    Logger.warn = originalLogger.warn;
    Logger.log = originalLogger.log;
    Logger.debug = originalLogger.debug;
    Logger.verbose = originalLogger.verbose;
  });
}
