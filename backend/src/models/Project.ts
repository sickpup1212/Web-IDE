import { query } from '../db';
import { QueryResult } from 'pg';

export interface Project {
  id: number;
  user_id: number;
  name: string;
  html_code: string;
  css_code: string;
  js_code: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateProjectData {
  name: string;
  html_code?: string;
  css_code?: string;
  js_code?: string;
}

export interface UpdateProjectData {
  name?: string;
  html_code?: string;
  css_code?: string;
  js_code?: string;
}

/**
 * Project Model - Handles all project-related database operations
 */
export class ProjectModel {
  /**
   * Create a new project
   * @param userId - ID of the user creating the project
   * @param data - Project data (name is required, code fields default to empty strings)
   * @returns Created project
   * @throws Error if database error occurs
   */
  static async createProject(userId: number, data: CreateProjectData): Promise<Project> {
    try {
      const { name, html_code = '', css_code = '', js_code = '' } = data;

      const result: QueryResult = await query(
        `INSERT INTO projects (user_id, name, html_code, css_code, js_code)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, user_id, name, html_code, css_code, js_code, created_at, updated_at`,
        [userId, name, html_code, css_code, js_code]
      );

      if (result.rows.length === 0) {
        throw new Error('Failed to create project');
      }

      return result.rows[0] as Project;
    } catch (error: any) {
      console.error('Error creating project:', error);
      throw new Error('Database error while creating project');
    }
  }

  /**
   * Find all projects belonging to a user
   * @param userId - User ID
   * @returns Array of projects (sorted by updated_at descending)
   */
  static async findByUserId(userId: number): Promise<Project[]> {
    try {
      const result: QueryResult = await query(
        `SELECT id, user_id, name, html_code, css_code, js_code, created_at, updated_at
         FROM projects
         WHERE user_id = $1
         ORDER BY updated_at DESC`,
        [userId]
      );

      return result.rows as Project[];
    } catch (error) {
      console.error('Error finding projects by user ID:', error);
      throw new Error('Database error while finding projects');
    }
  }

  /**
   * Find project by ID
   * @param id - Project ID
   * @returns Project object or null if not found
   */
  static async findById(id: number): Promise<Project | null> {
    try {
      const result: QueryResult = await query(
        `SELECT id, user_id, name, html_code, css_code, js_code, created_at, updated_at
         FROM projects
         WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0] as Project;
    } catch (error) {
      console.error('Error finding project by ID:', error);
      throw new Error('Database error while finding project');
    }
  }

  /**
   * Update project (with ownership check)
   * @param id - Project ID
   * @param userId - User ID (for ownership verification)
   * @param data - Project data to update
   * @returns Updated project or null if not found or not owned by user
   */
  static async updateProject(
    id: number,
    userId: number,
    data: UpdateProjectData
  ): Promise<Project | null> {
    try {
      // First, verify the project exists and belongs to the user
      const existingProject = await this.findById(id);

      if (!existingProject) {
        return null;
      }

      if (existingProject.user_id !== userId) {
        throw new Error('User does not own this project');
      }

      // Build the update query dynamically based on provided fields
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (data.name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(data.name);
      }

      if (data.html_code !== undefined) {
        updates.push(`html_code = $${paramIndex++}`);
        values.push(data.html_code);
      }

      if (data.css_code !== undefined) {
        updates.push(`css_code = $${paramIndex++}`);
        values.push(data.css_code);
      }

      if (data.js_code !== undefined) {
        updates.push(`js_code = $${paramIndex++}`);
        values.push(data.js_code);
      }

      // Always update the updated_at timestamp
      updates.push(`updated_at = CURRENT_TIMESTAMP`);

      // If no fields to update (shouldn't happen, but defensive)
      if (updates.length === 1) {
        return existingProject;
      }

      // Add ID to values array for WHERE clause
      values.push(id);

      const result: QueryResult = await query(
        `UPDATE projects
         SET ${updates.join(', ')}
         WHERE id = $${paramIndex}
         RETURNING id, user_id, name, html_code, css_code, js_code, created_at, updated_at`,
        values
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0] as Project;
    } catch (error: any) {
      console.error('Error updating project:', error);
      if (error.message === 'User does not own this project') {
        throw error;
      }
      throw new Error('Database error while updating project');
    }
  }

  /**
   * Delete project (with ownership check)
   * @param id - Project ID
   * @param userId - User ID (for ownership verification)
   * @returns True if deleted, false if not found or not owned by user
   * @throws Error if ownership check fails
   */
  static async deleteProject(id: number, userId: number): Promise<boolean> {
    try {
      // First, verify the project exists and belongs to the user
      const existingProject = await this.findById(id);

      if (!existingProject) {
        return false;
      }

      if (existingProject.user_id !== userId) {
        throw new Error('User does not own this project');
      }

      const result: QueryResult = await query(
        'DELETE FROM projects WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      return result.rowCount !== null && result.rowCount > 0;
    } catch (error: any) {
      console.error('Error deleting project:', error);
      if (error.message === 'User does not own this project') {
        throw error;
      }
      throw new Error('Database error while deleting project');
    }
  }
}

export default ProjectModel;
