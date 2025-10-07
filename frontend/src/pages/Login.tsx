import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/forms.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user, isLoading: isAuthLoading } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Check if there's a success message from registration
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the state so message doesn't persist on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  if (isAuthLoading) {
    return <LoadingSpinner />; // Show a full-page spinner while checking auth
  }

  // If auth check is done and user is logged in, redirect
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await login(username, password);
      // Login successful, redirect to dashboard
      navigate('/dashboard');
    } catch (error: any) {
      setError(error.message || 'Invalid username or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="form-container">
      <div className="form-card">
        <h1>Welcome Back</h1>
        <p className="subtitle">Log in to your account</p>

        <form onSubmit={handleSubmit} className="form" noValidate>
          {/* Success Message */}
          {successMessage && (
            <div className="error-alert" style={{ backgroundColor: '#d4edda', color: '#155724', borderColor: '#c3e6cb' }}>
              {successMessage}
            </div>
          )}

          {/* Error Display */}
          {error && <div className="error-alert">{error}</div>}

          {/* Username Field */}
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError(''); // Clear error when user types
              }}
              disabled={isLoading}
              autoComplete="username"
              placeholder="Enter your username"
            />
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(''); // Clear error when user types
              }}
              disabled={isLoading}
              autoComplete="current-password"
              placeholder="Enter your password"
            />
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
              'Log In'
            )}
          </button>
        </form>

        {/* Link to Register */}
        <div className="form-link">
          Don't have an account? <Link to="/register">Sign up</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
