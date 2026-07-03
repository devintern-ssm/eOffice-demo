import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { ApiError } from '../utils/http.js';
import type { Role } from '../utils/domain.js';

export interface AuthUser {
  id: string;
  role: Role;
  section: string;
  name: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

function readToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

/** Require a valid JWT; attaches req.user. */
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const token = readToken(req);
  if (!token) throw ApiError.unauthorized('Missing bearer token');
  try {
    const payload = jwt.verify(token, config.jwtSecret) as jwt.JwtPayload;
    req.user = {
      id: String(payload.sub),
      role: payload.role as Role,
      section: payload.section as string,
      name: payload.name as string,
    };
    next();
  } catch {
    throw ApiError.unauthorized('Invalid or expired token');
  }
}

/** Attach req.user if a valid token is present, but don't require it. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = readToken(req);
  if (!token) return next();
  try {
    const payload = jwt.verify(token, config.jwtSecret) as jwt.JwtPayload;
    req.user = {
      id: String(payload.sub),
      role: payload.role as Role,
      section: payload.section as string,
      name: payload.name as string,
    };
  } catch {
    /* ignore invalid token in optional mode */
  }
  next();
}

/** Require the authenticated user to hold one of the given roles. */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw ApiError.unauthorized();
    if (!roles.includes(req.user.role)) throw ApiError.forbidden('Insufficient role');
    next();
  };
}
