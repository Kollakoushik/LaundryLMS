import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'laundry-mgmt-portal-secret-jwt-key-2026';

export interface JwtUserPayload {
  uid: string;
  email: string;
  name: string;
  role: string;
}

export function generateJwtToken(payload: JwtUserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyJwtToken(token: string): JwtUserPayload {
  return jwt.verify(token, JWT_SECRET) as JwtUserPayload;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
