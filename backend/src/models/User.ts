import bcrypt from 'bcrypt';
import { query } from '../db';
import { QueryResult } from 'pg';

export interface User {
  id: number;
  username: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserWithoutPassword {
  id: number;
  username: string;
  created_at: Date;
  updated_at: Date;
}

const SALT_ROUNDS = 10;

/**
 * User Model - Handles all user-related database operations
 */
export class UserModel {
  /**
   * Create a new user
   * @param username - User's username (3-255 chars, alphanumeric + underscores)
   * @param password - Plain text password (min 8 chars)
   * @returns Created user without password hash
   * @throws Error if username already exists or database error occurs
   */
  static async createUser(username: string, password: string): Promise<UserWithoutPassword> {
    try {
      // Hash the password
      const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

      // Insert user into database
      const result: QueryResult = await query(
        `INSERT INTO users (username, password_hash)
         VALUES ($1, $2)
         RETURNING id, username, created_at, updated_at`,
        [username, password_hash]
      );

      if (result.rows.length === 0) {
        throw new Error('Failed to create user');
      }

      return result.rows[0] as UserWithoutPassword;
    } catch (error: any) {
      // Handle duplicate username error
      if (error.code === '23505') { // PostgreSQL unique violation error code
        throw new Error('Username already exists');
      }
      throw error;
    }
  }

  /**
   * Find user by username
   * @param username - Username to search for
   * @returns User object with password hash or null if not found
   */
  static async findByUsername(username: string): Promise<User | null> {
    try {
      const result: QueryResult = await query(
        'SELECT id, username, password_hash, created_at, updated_at FROM users WHERE username = $1',
        [username]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0] as User;
    } catch (error) {
      console.log('Error finding user by username:', error);
      throw new Error('Database error while finding user');
    }
  }

  /**
   * Find user by ID
   * @param id - User ID
   * @returns User object without password hash or null if not found
   */
  static async findById(id: number): Promise<UserWithoutPassword | null> {
    try {
      const result: QueryResult = await query(
        'SELECT id, username, created_at, updated_at FROM users WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0] as UserWithoutPassword;
    } catch (error) {
      console.log('Error finding user by ID:', error);
      throw new Error('Database error while finding user');
    }
  }

  /**
   * Verify user password
   * @param plainPassword - Plain text password to verify
   * @param hashedPassword - Hashed password from database
   * @returns True if password matches, false otherwise
   */
  static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.log('Error verifying password:', error);
      return false;
    }
  }

  /**
   * Remove sensitive data from user object
   * @param user - User object potentially containing password hash
   * @returns User object without password hash
   */
  static sanitizeUser(user: User): UserWithoutPassword {
    const { password_hash, ...sanitized } = user;
    return sanitized;
  }
}

export default UserModel;
