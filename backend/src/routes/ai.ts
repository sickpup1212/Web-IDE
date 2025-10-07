import { Router, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import aiService from '../services/aiService';

const router = Router();

// Rate limiting map (simple in-memory implementation)
// In production, use Redis or a proper rate limiting library
const userRequestCounts = new Map<number, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds
const MAX_REQUESTS_PER_HOUR = 50;

/**
 * Simple rate limiter middleware
 */
function rateLimiter(req: AuthRequest, res: Response, next: NextFunction) {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({
      error: {
        message: 'Authentication required',
        code: 'UNAUTHORIZED',
      },
    });
  }

  const now = Date.now();
  const userLimit = userRequestCounts.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    // Initialize or reset the rate limit counter
    userRequestCounts.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return next();
  }

  if (userLimit.count >= MAX_REQUESTS_PER_HOUR) {
    const minutesUntilReset = Math.ceil((userLimit.resetTime - now) / (60 * 1000));
    return res.status(429).json({
      error: {
        message: `Rate limit exceeded. You can send ${MAX_REQUESTS_PER_HOUR} messages per hour. Please try again in ${minutesUntilReset} minutes.`,
        code: 'RATE_LIMIT_EXCEEDED',
      },
    });
  }

  // Increment the request count
  userLimit.count += 1;
  next();
}

/**
 * POST /api/ai/chat
 * Send a message to the AI assistant
 *
 * Request body:
 * - message: string (required, 1-5000 chars)
 * - includeCode: boolean (optional, default: false)
 * - html: string (optional, code context)
 * - css: string (optional, code context)
 * - js: string (optional, code context)
 * - conversationHistory: array (optional, previous messages)
 *
 * Responses:
 * - 200: Successfully got AI response
 * - 400: Validation error
 * - 401: Not authenticated
 * - 429: Rate limit exceeded
 * - 500: AI service error
 * - 503: AI service unavailable
 */
router.post(
  '/chat',
  authMiddleware,
  rateLimiter,
  [
    // Validation middleware
    body('message')
      .trim()
      .notEmpty()
      .withMessage('Message is required')
      .isLength({ min: 1, max: 5000 })
      .withMessage('Message must be between 1 and 5000 characters'),
    body('includeCode')
      .optional()
      .isBoolean()
      .withMessage('includeCode must be a boolean'),
    body('html')
      .optional()
      .isString()
      .withMessage('HTML must be a string')
      .isLength({ max: 100000 })
      .withMessage('HTML code is too large'),
    body('css')
      .optional()
      .isString()
      .withMessage('CSS must be a string')
      .isLength({ max: 100000 })
      .withMessage('CSS code is too large'),
    body('js')
      .optional()
      .isString()
      .withMessage('JavaScript must be a string')
      .isLength({ max: 100000 })
      .withMessage('JavaScript code is too large'),
    body('conversationHistory')
      .optional()
      .isArray()
      .withMessage('conversationHistory must be an array')
      .custom((history) => {
        if (history.length > 20) {
          throw new Error('Conversation history too long (max 20 messages)');
        }
        return true;
      }),
  ],
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: errors.array(),
          },
        });
      }

      // Check if AI service is available
      if (!aiService.isAvailable()) {
        return res.status(503).json({
          error: {
            message: 'AI service is not configured. Please contact the administrator.',
            code: 'SERVICE_UNAVAILABLE',
          },
        });
      }

      const {
        message,
        includeCode = false,
        html = '',
        css = '',
        js = '',
        conversationHistory = [],
      } = req.body;

      // Prepare code context if requested
      let codeContext = undefined;
      if (includeCode) {
        codeContext = {
          html: html || undefined,
          css: css || undefined,
          js: js || undefined,
        };
      }

      // Call AI service
      const aiResponse = await aiService.sendChatMessage(
        message,
        codeContext,
        conversationHistory
      );

      // Return the response
      return res.status(200).json({
        message: aiResponse,
      });
    } catch (error: any) {
      console.error('AI chat error:', error);

      // Handle specific error types
      if (error.message.includes('Rate limit')) {
        return res.status(429).json({
          error: {
            message: error.message,
            code: 'RATE_LIMIT_EXCEEDED',
          },
        });
      }

      if (error.message.includes('API key')) {
        return res.status(503).json({
          error: {
            message: 'AI service configuration error. Please contact the administrator.',
            code: 'SERVICE_MISCONFIGURED',
          },
        });
      }

      if (error.message.includes('not available') || error.message.includes('unavailable')) {
        return res.status(503).json({
          error: {
            message: error.message,
            code: 'SERVICE_UNAVAILABLE',
          },
        });
      }

      if (error.message.includes('Network error')) {
        return res.status(503).json({
          error: {
            message: 'Unable to connect to AI service. Please try again later.',
            code: 'NETWORK_ERROR',
          },
        });
      }

      // Generic error response
      return res.status(500).json({
        error: {
          message: 'An error occurred while processing your request. Please try again.',
          code: 'INTERNAL_ERROR',
        },
      });
    }
  }
);

/**
 * GET /api/ai/status
 * Check if AI service is available
 *
 * Responses:
 * - 200: Service status
 */
router.get('/status', authMiddleware, (_req: AuthRequest, res: Response) => {
  const isAvailable = aiService.isAvailable();

  return res.status(200).json({
    available: isAvailable,
    message: isAvailable
      ? 'AI service is available'
      : 'AI service is not configured',
  });
});

export default router;
