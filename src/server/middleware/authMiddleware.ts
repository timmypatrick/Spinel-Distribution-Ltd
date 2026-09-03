import { Request, Response, NextFunction } from 'express';
import { verifySessionToken } from '../services/authService';
import { db } from '../db/schema';
import { UserProfile, PermissionCode, RoleName } from '../../types';
import { RBACService } from '../services/rbacService';

export interface AuthenticatedRequest extends Request {
  user?: UserProfile;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return next();
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const session = verifySessionToken(token);
  if (session && session.userId) {
    const user = db.users.get(session.userId);
    if (user && user.is_active) {
      const { password_hash, ...safeUser } = user;
      req.user = safeUser;
    }
  }

  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  next();
}

export function requirePermission(permission: PermissionCode) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!RBACService.hasPermission(req.user, permission)) {
      return res.status(403).json({
        error: `Forbidden: You lack the required permission [${permission}].`,
        required_permission: permission
      });
    }

    next();
  };
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Administrative authentication required.' });
  }

  if (!RBACService.isAdmin(req.user)) {
    return res.status(403).json({ error: 'Access denied: Administrative privileges required.' });
  }

  next();
}
