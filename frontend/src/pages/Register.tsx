import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { register } from '../services/auth';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/forms.css';

const Register: React.FC = () => {
  const navigate = useNavigate();

  const { user, isLoading: isAuthLoading } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Client-side validation for username
  const validateUsername = (value: string): string => {
    if (!value) {
      return 'Username is required';
    }
    if (value.length < 3) {
      return 'Username must be at least 3 characters';
    }
    if (value.length > 255) {
      return 'Username must be less than 255 characters';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      return 'Username can only contain letters, numbers, and underscores';
    }
    return '';
  };

  const validatePassword = (value: string): string => {
    if (!value) {
      return 'Password is required';
    }
    if (value.length < 8) {
      return 'Password must be at least 8 characters';
    }
    return '';
  };


  if (isAuthLoading) {
    return <LoadingSpinner />; // Show a full-page spinner while checking auth
  }
  
  // If auth check is done and user is logged in, redirect
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Handle username input change
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    setUsernameError(validateUsername(value));
    setApiError(''); // Clear API error when user types
  };

  // Handle password input change
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordError(validatePassword(value));
    setApiError(''); // Clear API error when user types
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate both fields
    const usernameValidationError = validateUsername(username);
    const passwordValidationError = validatePassword(password);

    setUsernameError(usernameValidationError);
    setPasswordError(passwordValidationError);

    // Don't submit if there are validation errors
    if (usernameValidationError || passwordValidationError) {
      return;
    }

    setIsLoading(true);
    setApiError('');

    try {
      await register(username, password);
      // Registration successful, redirect to login
      navigate('/login', {
        state: { message: 'Registration successful! Please log in.' }
      });
    } catch (error: any) {
      setApiError(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="form-container">
      <div className="form-card">
        <h1>Create Account</h1>
        <p className="subtitle">Sign up to get started</p>

        <form onSubmit={handleSubmit} className="form" noValidate>
          {/* API Error Display */}
          {apiError && <div className="error-alert">{apiError}</div>}

          {/* Username Field */}
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={handleUsernameChange}
              className={usernameError ? 'error' : ''}
              disabled={isLoading}
              autoComplete="username"
              placeholder="Enter your username"
            />
            <p className="error-message">{usernameError}</p>
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              className={passwordError ? 'error' : ''}
              disabled={isLoading}
              autoComplete="new-password"
              placeholder="Enter your password"
            />
            <p className="error-message">{passwordError}</p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="form-loading">
                <LoadingSpinner size="small" />
              </div>
            ) : (
              'Sign Up'
            )}
          </button>
        </form>

        {/* Link to Login */}
        <div className="form-link">
          Already have an account? <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
