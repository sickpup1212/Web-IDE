import api from './api';

export interface RegisterData {
  username: string;
  password: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
}

export interface AuthResponse {
  user: User;
}

/**
 * Register a new user
 * @param username - Username (3-255 chars, alphanumeric + underscores)
 * @param password - Password (min 8 chars)
 * @returns User data
 */
export const register = async (username: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>('/auth/register', {
      username,
      password,
    });
    return response.data;
  } catch (error: any) {
    // Extract user-friendly error message
    if (error.response?.data?.error?.message) {
      throw new Error(error.response.data.error.message);
    } else if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else if (error.message) {
      throw new Error(error.message);
    } else {
      throw new Error('Registration failed. Please try again.');
    }
  }
};

/**
 * Login an existing user
 * @param username - Username
 * @param password - Password
 * @returns User data and sets httpOnly cookie
 */
export const login = async (username: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>('/auth/login', {
      username,
      password,
    });
    return response.data;
  } catch (error: any) {
    // Extract user-friendly error message
    if (error.response?.data?.error?.message) {
      throw new Error(error.response.data.error.message);
    } else if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else if (error.message) {
      throw new Error(error.message);
    } else {
      throw new Error('Login failed. Please try again.');
    }
  }
};

/**
 * Logout the current user
 */
export const logout = async (): Promise<void> => {
  try {
    await api.post('/auth/logout');
  } catch (error: any) {
    // Logout should always succeed client-side even if server fails
    console.error('Logout error:', error);
  }
};

/**
 * Check current authentication status
 * @returns Current user data if authenticated
 */
export const checkAuth = async (): Promise<User | null> => {
  try {
    const response = await api.get<{ user: User }>('/auth/me');
    return response.data.user;
  } catch (error) {
    // Not authenticated
    return null;
  }
};
