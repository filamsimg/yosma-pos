import { SignJWT, jwtVerify } from 'jose';

export interface SessionPayload {
  id: string;
  email: string;
  role: 'ADMIN' | 'SALES';
  full_name: string;
}

const DEFAULT_SECRET = 'yosma-pos-default-jwt-secret-key-32-characters-minimum';

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || DEFAULT_SECRET;
  return new TextEncoder().encode(secret);
}

/**
 * Sign a JWT token for the user session (valid for 7 days)
 */
export async function signSessionToken(payload: SessionPayload): Promise<string> {
  const secret = getJwtSecret();
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

/**
 * Verify and decode a session JWT token
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
