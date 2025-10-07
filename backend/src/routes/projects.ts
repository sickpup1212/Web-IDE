import { Router, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { ProjectModel } from '../models/Project';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// All project routes require authentication
router.use(authMiddleware);

/**
 * GET /api/projects
 * Get all projects for the authenticated user
 *
 * Responses:
 * - 200: Array of projects
 * - 401: Not authenticated
 * - 500: Server error
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          message: 'Authentication required',
          code: 'NOT_AUTHENTICATED'
        }
      });
    }

    const projects = await ProjectModel.findByUserId(req.user.userId);

    return res.status(200).json({
      projects
    });
  } catch (error: any) {
    console.error('Get projects error:', error);
    return res.status(500).json({
      error: {
        message: 'An error occurred while fetching projects',
        code: 'FETCH_PROJECTS_ERROR'
      }
    });
  }
});

/**
 * POST /api/projects
 * Create a new project
 *
 * Request body:
 * - name: string (1-255 chars, required)
 * - html_code: string (optional, defaults to empty string)
 * - css_code: string (optional, defaults to empty string)
 * - js_code: string (optional, defaults to empty string)
 *
 * Responses:
 * - 201: Project created successfully
 * - 400: Validation error
 * - 401: Not authenticated
 * - 500: Server error
 */
router.post(
  '/',
  [
    // Validation middleware
    body('name')
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Project name must be between 1 and 255 characters')
      .notEmpty()
      .withMessage('Project name is required'),
  ],
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            message: 'Authentication required',
            code: 'NOT_AUTHENTICATED'
          }
        });
      }

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

      const { name, html_code, css_code, js_code } = req.body;

      // Create project
      const project = await ProjectModel.createProject(req.user.userId, {
        name,
        html_code: html_code || '',
        css_code: css_code || '',
        js_code: js_code || ''
      });

      return res.status(201).json({
        message: 'Project created successfully',
        project
      });
    } catch (error: any) {
      console.error('Create project error:', error);
      return res.status(500).json({
        error: {
          message: 'An error occurred while creating project',
          code: 'CREATE_PROJECT_ERROR'
        }
      });
    }
  }
);

/**
 * GET /api/projects/:id
 * Get a single project by ID
 *
 * Responses:
 * - 200: Project data
 * - 401: Not authenticated
 * - 403: User does not own this project
 * - 404: Project not found
 * - 500: Server error
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          message: 'Authentication required',
          code: 'NOT_AUTHENTICATED'
        }
      });
    }

    const projectId = parseInt(req.params.id, 10);

    if (isNaN(projectId)) {
      return res.status(400).json({
        error: {
          message: 'Invalid project ID',
          code: 'INVALID_PROJECT_ID'
        }
      });
    }

    const project = await ProjectModel.findById(projectId);

    if (!project) {
      return res.status(404).json({
        error: {
          message: 'Project not found',
          code: 'PROJECT_NOT_FOUND'
        }
      });
    }

    // Verify ownership
    if (project.user_id !== req.user.userId) {
      return res.status(403).json({
        error: {
          message: 'You do not have permission to access this project',
          code: 'FORBIDDEN'
        }
      });
    }

    return res.status(200).json({
      project
    });
  } catch (error: any) {
    console.error('Get project error:', error);
    return res.status(500).json({
      error: {
        message: 'An error occurred while fetching project',
        code: 'FETCH_PROJECT_ERROR'
      }
    });
  }
});

/**
 * PUT /api/projects/:id
 * Update a project
 *
 * Request body (all optional):
 * - name: string (1-255 chars)
 * - html_code: string
 * - css_code: string
 * - js_code: string
 *
 * Responses:
 * - 200: Project updated successfully
 * - 400: Validation error
 * - 401: Not authenticated
 * - 403: User does not own this project
 * - 404: Project not found
 * - 500: Server error
 */
router.put(
  '/:id',
  [
    // Validation middleware (optional fields)
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Project name must be between 1 and 255 characters'),
  ],
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            message: 'Authentication required',
            code: 'NOT_AUTHENTICATED'
          }
        });
      }

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

      const projectId = parseInt(req.params.id, 10);

      if (isNaN(projectId)) {
        return res.status(400).json({
          error: {
            message: 'Invalid project ID',
            code: 'INVALID_PROJECT_ID'
          }
        });
      }

      const { name, html_code, css_code, js_code } = req.body;

      // Update project
      const project = await ProjectModel.updateProject(
        projectId,
        req.user.userId,
        {
          name,
          html_code,
          css_code,
          js_code
        }
      );

      if (!project) {
        return res.status(404).json({
          error: {
            message: 'Project not found',
            code: 'PROJECT_NOT_FOUND'
          }
        });
      }

      return res.status(200).json({
        message: 'Project updated successfully',
        project
      });
    } catch (error: any) {
      // Handle ownership error
      if (error.message === 'User does not own this project') {
        return res.status(403).json({
          error: {
            message: 'You do not have permission to update this project',
            code: 'FORBIDDEN'
          }
        });
      }

      console.error('Update project error:', error);
      return res.status(500).json({
        error: {
          message: 'An error occurred while updating project',
          code: 'UPDATE_PROJECT_ERROR'
        }
      });
    }
  }
);

/**
 * DELETE /api/projects/:id
 * Delete a project
 *
 * Responses:
 * - 204: Project deleted successfully
 * - 401: Not authenticated
 * - 403: User does not own this project
 * - 404: Project not found
 * - 500: Server error
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          message: 'Authentication required',
          code: 'NOT_AUTHENTICATED'
        }
      });
    }

    const projectId = parseInt(req.params.id, 10);

    if (isNaN(projectId)) {
      return res.status(400).json({
        error: {
          message: 'Invalid project ID',
          code: 'INVALID_PROJECT_ID'
        }
      });
    }

    const deleted = await ProjectModel.deleteProject(projectId, req.user.userId);

    if (!deleted) {
      return res.status(404).json({
        error: {
          message: 'Project not found',
          code: 'PROJECT_NOT_FOUND'
        }
      });
    }

    return res.status(204).send();
  } catch (error: any) {
    // Handle ownership error
    if (error.message === 'User does not own this project') {
      return res.status(403).json({
        error: {
          message: 'You do not have permission to delete this project',
          code: 'FORBIDDEN'
        }
      });
    }

    console.error('Delete project error:', error);
    return res.status(500).json({
      error: {
        message: 'An error occurred while deleting project',
        code: 'DELETE_PROJECT_ERROR'
      }
    });
  }
});

export default router;
