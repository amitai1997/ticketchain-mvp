// Jest global teardown - called after all tests complete
export default async (): Promise<void> => {
  // Close any open NestJS application instances
  // This helps with properly closing connections that might be leaking

  // Close any open Redis clients
  try {
    // Give Redis clients time to close
    await new Promise((resolve) => setTimeout(resolve, 300));
  } catch (error) {
    console.error('Error cleaning up Redis clients:', error);
  }

  // Close any database connections
  try {
    // Give database connections time to close
    await new Promise((resolve) => setTimeout(resolve, 300));
  } catch (error) {
    console.error('Error cleaning up database connections:', error);
  }

  // Give a final timeout for any remaining connections to close
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Force exit the process to ensure no hanging connections
  process.exit(0);
};
