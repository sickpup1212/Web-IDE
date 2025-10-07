import api from './api';
import { Project } from '../types';

/**
 * Fetch all projects for the authenticated user
 */
export const getProjects = async (): Promise<Project[]> => {
  try {
    const response = await api.get<{ projects: Project[] }>('/projects');
    return response.data.projects;
  } catch (error: any) {
    // Handle specific error cases
    if (error.response) {
      throw new Error(
        error.response.data?.error?.message || 'Failed to fetch projects'
      );
    } else if (error.request) {
      throw new Error('No response from server. Please check your connection.');
    } else {
      throw new Error('Failed to fetch projects');
    }
  }
};

/**
 * Fetch a single project by ID
 */
export const getProject = async (id: number): Promise<Project> => {
  try {
    const response = await api.get<{ project: Project }>(`/projects/${id}`);
    return response.data.project;
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error('Project not found');
    } else if (error.response?.status === 403) {
      throw new Error('You do not have permission to access this project');
    } else if (error.response) {
      throw new Error(
        error.response.data?.error?.message || 'Failed to fetch project'
      );
    } else if (error.request) {
      throw new Error('No response from server. Please check your connection.');
    } else {
      throw new Error('Failed to fetch project');
    }
  }
};

/**
 * Create a new project
 */
export const createProject = async (
  name: string,
  html_code = '',
  css_code = '',
  js_code = ''
): Promise<Project> => {
  try {
    const response = await api.post<{ message: string; project: Project }>('/projects', {
      name,
      html_code,
      css_code,
      js_code,
    });
    return response.data.project;
  } catch (error: any) {
    if (error.response) {
      throw new Error(
        error.response.data?.error?.message || 'Failed to create project'
      );
    } else if (error.request) {
      throw new Error('No response from server. Please check your connection.');
    } else {
      throw new Error('Failed to create project');
    }
  }
};

/**
 * Update an existing project
 */
export const updateProject = async (
  id: number,
  updates: Partial<Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<Project> => {
  try {
    const response = await api.put<{ message: string; project: Project }>(`/projects/${id}`, updates);
    return response.data.project;
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error('Project not found');
    } else if (error.response?.status === 403) {
      throw new Error('You do not have permission to update this project');
    } else if (error.response) {
      throw new Error(
        error.response.data?.error?.message || 'Failed to update project'
      );
    } else if (error.request) {
      throw new Error('No response from server. Please check your connection.');
    } else {
      throw new Error('Failed to update project');
    }
  }
};

/**
 * Delete a project
 */
export const deleteProject = async (id: number): Promise<void> => {
  try {
    await api.delete(`/projects/${id}`);
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error('Project not found');
    } else if (error.response?.status === 403) {
      throw new Error('You do not have permission to delete this project');
    } else if (error.response) {
      throw new Error(
        error.response.data?.error?.message || 'Failed to delete project'
      );
    } else if (error.request) {
      throw new Error('No response from server. Please check your connection.');
    } else {
      throw new Error('Failed to delete project');
    }
  }
};
