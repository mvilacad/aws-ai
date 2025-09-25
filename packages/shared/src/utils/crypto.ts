import { createHash, createHmac, randomBytes } from 'crypto';

export function generateSalt(length = 16): string {
  return randomBytes(length).toString('hex');
}

export function hash(data: string, algorithm = 'sha256'): string {
  return createHash(algorithm).update(data).digest('hex');
}

export function hashWithSalt(
  data: string,
  salt: string,
  algorithm = 'sha256'
): string {
  return createHash(algorithm)
    .update(data + salt)
    .digest('hex');
}

export function hmac(
  data: string,
  secret: string,
  algorithm = 'sha256'
): string {
  return createHmac(algorithm, secret).update(data).digest('hex');
}

export function generateApiKey(prefix = 'ak', length = 32): string {
  const key = randomBytes(length).toString('hex');
  return `${prefix}_${key}`;
}

export function generateCorrelationId(): string {
  return randomBytes(16).toString('hex');
}

export function hashPassword(
  password: string,
  salt?: string
): { hash: string; salt: string } {
  const passwordSalt = salt || generateSalt();
  const passwordHash = hashWithSalt(password, passwordSalt, 'sha512');

  return {
    hash: passwordHash,
    salt: passwordSalt,
  };
}

export function verifyPassword(
  password: string,
  hash: string,
  salt: string
): boolean {
  const { hash: computedHash } = hashPassword(password, salt);
  return computedHash === hash;
}

export function maskSensitiveData(data: string, visibleChars = 4): string {
  if (data.length <= visibleChars * 2) {
    return '*'.repeat(data.length);
  }

  const start = data.substring(0, visibleChars);
  const end = data.substring(data.length - visibleChars);
  const middle = '*'.repeat(data.length - visibleChars * 2);

  return `${start}${middle}${end}`;
}

export function generateSecureToken(length = 32): string {
  return randomBytes(length).toString('base64url');
}

export function generateSessionId(): string {
  return `sess_${randomBytes(20).toString('hex')}`;
}

export function generateRequestId(): string {
  return `req_${randomBytes(12).toString('hex')}`;
}
