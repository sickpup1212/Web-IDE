import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import * as authService from '../services/auth';

interface User {
  id: number;
  username: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start true for initial auth check

  // This effect runs once when the component mounts to check for an active session.
  useEffect(() => {
    /**
     * Check authentication status (for session persistence)
     */
    const checkAuthStatus = async (): Promise<void> => {
      try {
        const currentUser = await authService.checkAuth();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []); // Empty dependency array ensures this runs only once on mount

  /**
   * Login user with username and password
   */
  const login = async (username: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await authService.login(username, password);
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout current user
   */
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
