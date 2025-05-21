import * as crypto from 'crypto';

export function generateShortHash(input: string): string {
  const hash = crypto.createHash('sha256').update(input).digest('hex');
  return hash.slice(0, 8); // Return 8-digit hash value
}