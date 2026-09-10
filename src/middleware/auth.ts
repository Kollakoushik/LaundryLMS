import { Request, Response, NextFunction } from 'express';
import { verifyJwtToken, JwtUserPayload } from '../lib/jwt.ts';
import { adminAuth } from '../lib/firebase-admin.ts';

export interface AuthRequest extends Request {
  user?: JwtUserPayload;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please provide a valid Bearer token.',
      code: 'AUTH_TOKEN_MISSING',
    });
  }

  const token = authHeader.split('Bearer ')[1].trim();
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Malformed authorization header.',
      code: 'AUTH_TOKEN_MALFORMED',
    });
  }

  // First try custom JWT
  try {
    const decoded = verifyJwtToken(token);
    req.user = decoded;
    return next();
  } catch (jwtErr) {
    // If not standard JWT, try Firebase Auth token
    try {
      const decodedFirebase = await adminAuth.verifyIdToken(token);
      req.user = {
        uid: decodedFirebase.uid,
        email: decodedFirebase.email || 'admin@laundry.local',
        name: decodedFirebase.name || 'Admin User',
        role: 'admin',
      };
      return next();
    } catch (firebaseErr) {
      console.warn('Authentication token verification failed:', (jwtErr as Error).message);
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired authentication token. Please log in again.',
        code: 'AUTH_TOKEN_INVALID',
      });
    }
  }
};
