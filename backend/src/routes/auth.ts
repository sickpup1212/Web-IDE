import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user
 *
 * Request body:
 * - username: string (3-255 chars, alphanumeric + underscores)
 * - password: string (min 8 chars)
 *
 * Responses:
 * - 201: User created successfully
 * - 400: Validation error
 * - 409: Username already exists
 * - 500: Server error
 */
router.post(
  '/register',
  [
    // Validation middleware
    body('username')
      .trim()
      .isLength({ min: 3, max: 255 })
      .withMessage('Username must be between 3 and 255 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long'),
  ],
  async (req: Request, res: Response, _next: NextFunction) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: errors.array()
          }
        });
      }

      const { username, password } = req.body;

      // Check if username or password is missing
      if (!username || !password) {
        return res.status(400).json({
          error: {
            message: 'Username and password are required',
            code: 'MISSING_FIELDS'
          }
        });
      }

      // Create user
      const user = await UserModel.createUser(username, password);

      // Return success with user data (without password)
      return res.status(201).json({
        message: 'User created successfully',
        user: {
          id: user.id,
          username: user.username,
          created_at: user.created_at
        }
      });
    } catch (error: any) {
      // Handle duplicate username error
      if (error.message === 'Username already exists') {
        return res.status(409).json({
          error: {
            message: 'Username already exists',
            code: 'DUPLICATE_USERNAME'
          }
        });
      }

      // Handle other errors
      console.log('Registration error:', error);
      return res.status(500).json({
        error: {
          message: 'An error occurred during registration',
          code: 'REGISTRATION_ERROR'
        }
      });
    }
  }
);

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token in httpOnly cookie
 *
 * Request body:
 * - username: string
 * - password: string
 *
 * Responses:
 * - 200: Login successful with user data
 * - 400: Validation error
 * - 401: Invalid credentials
 * - 500: Server error
 */
router.post(
  '/login',
  [
    // Validation middleware
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req: Request, res: Response, _next: NextFunction) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: errors.array()
          }
        });
      }

      const { username, password } = req.body;

      // Find user by username
      const user = await UserModel.findByUsername(username);

      if (!user) {
        return res.status(401).json({
          error: {
            message: 'Invalid credentials',
            code: 'INVALID_CREDENTIALS'
          }
        });
      }

      // Verify password
      const isPasswordValid = await UserModel.verifyPassword(password, user.password_hash);

      if (!isPasswordValid) {
        return res.status(401).json({
          error: {
            message: 'Invalid credentials',
            code: 'INVALID_CREDENTIALS'
          }
        });
      }

      // Get JWT configuration from environment
      const JWT_SECRET = process.env.JWT_SECRET;

      if (!JWT_SECRET) {
        console.log('JWT_SECRET is not configured');
        return res.status(500).json({
          error: {
            message: 'Server configuration error',
            code: 'CONFIGURATION_ERROR'
          }
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          username: user.username
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Set JWT in httpOnly cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Only use secure in production
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
      });

      // Return success with user data (without password)
      return res.status(200).json({
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username,
          created_at: user.created_at
        }
      });
    } catch (error: any) {
      console.log('Login error:', error);
      return res.status(500).json({
        error: {
          message: 'An error occurred during login',
          code: 'LOGIN_ERROR'
        }
      });
    }
  }
);

/**
 * POST /api/auth/logout
 * Clear authentication token cookie
 *
 * Responses:
 * - 200: Logout successful
 */
router.post('/logout', (_req: Request, res: Response) => {
  try {
    // Clear the token cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    return res.status(200).json({
      message: 'Logout successful'
    });
  } catch (error: any) {
    console.log('Logout error:', error);
    return res.status(500).json({
      error: {
        message: 'An error occurred during logout',
        code: 'LOGOUT_ERROR'
      }
    });
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user information
 * Requires authentication
 *
 * Responses:
 * - 200: User data
 * - 401: Not authenticated
 * - 404: User not found
 * - 500: Server error
 */
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          message: 'Not authenticated',
          code: 'NOT_AUTHENTICATED'
        }
      });
    }

    // Get full user data from database
    const user = await UserModel.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      });
    }

    return res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        created_at: user.created_at
      }
    });
  } catch (error: any) {
    console.log('Get user error:', error);
    next(error);
    return res.status(500).json({
      error: {
        message: 'An error occurred while fetching user data',
        code: 'FETCH_USER_ERROR'
      }
    });
  }
});

export default router;
