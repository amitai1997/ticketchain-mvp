import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Load test environment variables
 */
export function loadTestEnv(): void {
  const envPath = path.resolve(process.cwd(), '.env.test.local');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  } else {
    console.warn('No .env.test.local file found. Using default test configuration.');
    dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });
  }

  // Ensure we're using the in-memory database for tests
  process.env.ENABLE_IN_MEMORY_DB = 'true';
  process.env.NODE_ENV = 'test';
}

/**
 * Create a NestJS application for testing with proper cleanup
 * @param moduleMetadata Module metadata for test module
 * @param options Additional options for test app
 * @returns A promise resolving to the test app with cleanup function
 */
export async function createTestingApp(
  moduleMetadata: any,
  options: { globalPrefix?: string } = {}
): Promise<{
  app: INestApplication;
  moduleRef: TestingModule;
  cleanup: () => Promise<void>;
}> {
  // Load environment variables
  loadTestEnv();

  // Create the testing module
  const moduleRef = await Test.createTestingModule(moduleMetadata).compile();

  // Create the app
  const app = moduleRef.createNestApplication();

  // Set global prefix if provided or default to 'api'
  const globalPrefix = options.globalPrefix || 'api';
  app.setGlobalPrefix(globalPrefix);

  await app.init();

  // Return app with cleanup function
  return {
    app,
    moduleRef,
    cleanup: async () => {
      await app.close();
      await moduleRef.close();
    },
  };
}
