// src/components/PrivateRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Make sure this path is correct
import LoadingSpinner from './LoadingSpinner';

// Define the props for the component. It will accept 'children' to render.
interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  // Get user and isLoading state from our custom Auth hook
  const { user, isLoading } = useAuth();

  // 1. Show a loading spinner while the auth state is being determined.
  // This prevents a flash of the login page before the user is confirmed.
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // 2. If loading is finished and there is no user, redirect to the login page.
  // The 'Navigate' component from react-router-dom handles the redirection.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. If loading is finished and a user exists, render the child components.
  // 'children' will be whatever component you wrapped with PrivateRoute (e.g., <Dashboard />).
  return <>{children}</>;
};

export default PrivateRoute;
