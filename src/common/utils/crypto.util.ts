import { createHash, randomBytes } from 'crypto';

/**
 * Generate a random API key
 * @param length Length of the API key
 * @returns Random API key string
 */
export function generateApiKey(length = 32): string {
  return randomBytes(length).toString('hex');
}

/**
 * Hash a string using SHA-256
 * @param input String to hash
 * @returns Hexadecimal hash string
 */
export function sha256Hash(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

/**
 * Create a deterministic identifier from a set of values
 * @param values Values to hash
 * @returns Deterministic identifier
 */
export function createDeterministicId(...values: string[]): string {
  return sha256Hash(values.join('_'));
}

/**
 * Generate a secure scan token
 * @param ticketId Ticket identifier
 * @param timestamp Current timestamp
 * @param secret Secret key
 * @returns Secure scan token
 */
export function generateScanToken(ticketId: string, timestamp: number, secret: string): string {
  // Hash ticketId + timestamp + secret
  const hash = sha256Hash(`${ticketId}_${timestamp}_${secret}`);
  // Return as Base64 URL-safe string
  return Buffer.from(`${ticketId}:${timestamp}:${hash}`).toString('base64url');
}

/**
 * Verify a scan token
 * @param token Scan token to verify
 * @param secret Secret key
 * @param ttlSeconds Time-to-live in seconds
 * @returns Ticket ID if valid, null if invalid
 */
export function verifyScanToken(token: string, secret: string, ttlSeconds = 15): string | null {
  try {
    // Decode token
    const decoded = Buffer.from(token, 'base64url').toString();
    const [ticketId, timestamp, tokenHash] = decoded.split(':');

    if (!ticketId || !timestamp || !tokenHash) {
      return null;
    }

    // Check if token is expired
    const tokenTime = parseInt(timestamp, 10);
    const currentTime = Math.floor(Date.now() / 1000);

    if (isNaN(tokenTime) || currentTime - tokenTime > ttlSeconds) {
      return null;
    }

    // Verify hash
    const expectedHash = sha256Hash(`${ticketId}_${timestamp}_${secret}`);
    if (tokenHash !== expectedHash) {
      return null;
    }

    return ticketId;
  } catch (err) {
    return null;
  }
}
