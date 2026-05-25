// src/middleware/permissions.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { Permission } from '../utils/permissions';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string[];
    permissions: string[];
    [key: string]: any;
  };
}

/**
 * Middleware to check if the user has the required permission.
 *
 * @param {Permission} requiredPermission - The permission to check for.
 * @returns {RequestHandler} Express middleware.
 */
export function checkPermission(requiredPermission: Permission): RequestHandler {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userPermissions = req.user?.permissions || [];
    

    console.log('Checking User permission:', userPermissions);
    if (!userPermissions.includes(requiredPermission)) {
      res.status(403).json({
        success: false,
        error: 'forbidden',
        message: 'Missing required permission',
      });
      return;
    }

    next();
  };
}

