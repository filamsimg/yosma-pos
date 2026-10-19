import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hash plain password using bcryptjs
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify plain password against hashed password
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) return false;
  return bcrypt.compare(password, hash);
}
