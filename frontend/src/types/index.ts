// Type definitions for the application

export interface User {
  id: number;
  username: string;
}

export interface Project {
  id: number;
  user_id: number;
  name: string;
  html_code: string;
  css_code: string;
  js_code: string;
  created_at: string;
  updated_at: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}
