const JWT_SECRET = process.env.JWT_SECRET!;
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { blacklistTokens } from '../services/auth';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string[];
    permissions: string[];
    [key: string]: any;
  };
}




   



/**
 * Middleware to authenticate requests using JWT.
 * It checks for the presence of a Bearer token in the Authorization header,
 * verifies the token, and attaches the user information to the request object.
 *
 * @param {Request} req - The incoming request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 */

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization as string | '';
  // console.log('AuthHeader: ', req.headers)


  if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader == null) {
     res.status(401).json({ success: false, message: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];
  // console.log('Toekn:',token)

  try {

    if (blacklistTokens.length > 1000) {
      blacklistTokens.splice(0, 500);
    }

    if (blacklistTokens.includes(token)) {
      res.status(401).json({ success: false, message: 'Token has been revoked' });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      role: string[];
      school?: string; 
      permissions?: string[];
      [key: string]: any;
    };

    const user = {
      id: decoded.id,
      role: decoded.roles,
      school: decoded.school || null,
      permissions: Array.isArray(decoded.permissions) ? decoded.permissions : [],
    };
    (req as AuthenticatedRequest).user = user;

    next();
  } catch (err) {
    console.log('Token verification error:', err);
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }

}



