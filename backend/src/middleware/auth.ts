import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/**
 * Extended Express Request interface with user data
 */
export interface AuthRequest extends Request {
  user?: {
    userId: number;
    username: string;
  };
}

/**
 * JWT Payload interface
 */
interface JwtPayload {
  userId: number;
  username: string;
  iat?: number;
  exp?: number;
}

/**
 * Authentication Middleware
 * Verifies JWT token from httpOnly cookie and attaches user data to request
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 * @returns 401 if token is missing or invalid, otherwise calls next()
 */
export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void | Response => {
  try {
    // Extract JWT token from cookies
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        error: {
          message: 'Authentication required',
          code: 'MISSING_TOKEN'
        }
      });
    }

    // Verify JWT token
    const JWT_SECRET = process.env.JWT_SECRET;

    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      return res.status(500).json({
        error: {
          message: 'Server configuration error',
          code: 'CONFIGURATION_ERROR'
        }
      });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

      // Attach user data to request object
      req.user = {
        userId: decoded.userId,
        username: decoded.username
      };

      // Continue to next middleware
      next();
    } catch (jwtError: any) {
      // Handle specific JWT errors
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: {
            message: 'Token has expired',
            code: 'TOKEN_EXPIRED'
          }
        });
      }

      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          error: {
            message: 'Invalid token',
            code: 'INVALID_TOKEN'
          }
        });
      }

      // Generic JWT error
      return res.status(401).json({
        error: {
          message: 'Token verification failed',
          code: 'TOKEN_VERIFICATION_FAILED'
        }
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: {
        message: 'Authentication error',
        code: 'AUTH_ERROR'
      }
    });
  }
};

export default authMiddleware;
