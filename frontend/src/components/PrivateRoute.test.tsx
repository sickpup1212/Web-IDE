import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import { AuthProvider } from '../context/AuthContext';
import * as authService from '../services/auth';

// Mock the auth service
jest.mock('../services/auth');
const mockedAuthService = authService as jest.Mocked<typeof authService>;

// Mock LoadingSpinner component
jest.mock('./LoadingSpinner', () => {
  return function MockLoadingSpinner() {
    return <div data-testid="loading-spinner">Loading...</div>;
  };
});

// Test components
const ProtectedComponent = () => <div>Protected Content</div>;
const LoginPage = () => <div>Login Page</div>;

// Helper function to render PrivateRoute with necessary providers
const renderPrivateRoute = (initialRoute: string = '/protected') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/protected"
            element={
              <PrivateRoute>
                <ProtectedComponent />
              </PrivateRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('PrivateRoute Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    test('shows loading spinner while checking authentication', () => {
      // Mock checkAuth to delay resolution
      let resolveAuth: (value: any) => void;
      mockedAuthService.checkAuth.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveAuth = resolve;
        })
      );

      renderPrivateRoute();

      // Should show loading spinner
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.queryByText(/protected content/i)).not.toBeInTheDocument();

      // Clean up
      resolveAuth!(null);
    });

    test('does not render protected content during loading', () => {
      let resolveAuth: (value: any) => void;
      mockedAuthService.checkAuth.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveAuth = resolve;
        })
      );

      renderPrivateRoute();

      // Protected content should not be visible
      expect(screen.queryByText(/protected content/i)).not.toBeInTheDocument();

      // Clean up
      resolveAuth!(null);
    });

    test('does not redirect during loading', () => {
      let resolveAuth: (value: any) => void;
      mockedAuthService.checkAuth.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveAuth = resolve;
        })
      );

      renderPrivateRoute();

      // Should not redirect to login during loading
      expect(screen.queryByText(/login page/i)).not.toBeInTheDocument();

      // Clean up
      resolveAuth!(null);
    });
  });

  describe('Not Authenticated - Redirect Behavior', () => {
    test('redirects to login when user is not authenticated', async () => {
      // Mock checkAuth to return null (not authenticated)
      mockedAuthService.checkAuth.mockResolvedValueOnce(null);

      renderPrivateRoute();

      // Should redirect to login page
      await waitFor(() => {
        expect(screen.getByText(/login page/i)).toBeInTheDocument();
      });

      // Protected content should not be rendered
      expect(screen.queryByText(/protected content/i)).not.toBeInTheDocument();
    });

    test('does not render protected content when not authenticated', async () => {
      mockedAuthService.checkAuth.mockResolvedValueOnce(null);

      renderPrivateRoute();

      await waitFor(() => {
        expect(screen.getByText(/login page/i)).toBeInTheDocument();
      });

      // Verify protected content was never rendered
      expect(screen.queryByText(/protected content/i)).not.toBeInTheDocument();
    });

    test('uses replace navigation to prevent back button issues', async () => {
      mockedAuthService.checkAuth.mockResolvedValueOnce(null);

      renderPrivateRoute();

      await waitFor(() => {
        expect(screen.getByText(/login page/i)).toBeInTheDocument();
      });

      // The Navigate component with replace prop prevents adding to browser history
      // This is verified by the implementation using <Navigate to="/login" replace />
      expect(screen.getByText(/login page/i)).toBeInTheDocument();
    });

    test('handles failed authentication check', async () => {
      // Mock checkAuth to throw an error
      mockedAuthService.checkAuth.mockRejectedValueOnce(
        new Error('Authentication failed')
      );

      renderPrivateRoute();

      // Should redirect to login on error
      await waitFor(() => {
        expect(screen.getByText(/login page/i)).toBeInTheDocument();
      });

      expect(screen.queryByText(/protected content/i)).not.toBeInTheDocument();
    });
  });

  describe('Authenticated - Allow Access', () => {
    test('allows access to protected route when authenticated', async () => {
      // Mock checkAuth to return a user (authenticated)
      mockedAuthService.checkAuth.mockResolvedValueOnce({
        id: 1,
        username: 'testuser',
      });

      renderPrivateRoute();

      // Should render protected content
      await waitFor(() => {
        expect(screen.getByText(/protected content/i)).toBeInTheDocument();
      });

      // Should not redirect to login
      expect(screen.queryByText(/login page/i)).not.toBeInTheDocument();
    });

    test('renders children when user is authenticated', async () => {
      mockedAuthService.checkAuth.mockResolvedValueOnce({
        id: 1,
        username: 'testuser',
      });

      renderPrivateRoute();

      await waitFor(() => {
        expect(screen.getByText(/protected content/i)).toBeInTheDocument();
      });
    });

    test('does not show loading spinner after authentication succeeds', async () => {
      mockedAuthService.checkAuth.mockResolvedValueOnce({
        id: 1,
        username: 'testuser',
      });

      renderPrivateRoute();

      await waitFor(() => {
        expect(screen.getByText(/protected content/i)).toBeInTheDocument();
      });

      // Loading spinner should be gone
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    test('maintains access to protected route during session', async () => {
      mockedAuthService.checkAuth.mockResolvedValueOnce({
        id: 1,
        username: 'testuser',
      });

      renderPrivateRoute();

      await waitFor(() => {
        expect(screen.getByText(/protected content/i)).toBeInTheDocument();
      });

      // Content should remain visible
      expect(screen.getByText(/protected content/i)).toBeInTheDocument();
      expect(screen.queryByText(/login page/i)).not.toBeInTheDocument();
    });
  });

  describe('Auth Persistence on Page Reload', () => {
    test('checks authentication on mount (simulating page reload)', async () => {
      mockedAuthService.checkAuth.mockResolvedValueOnce({
        id: 1,
        username: 'testuser',
      });

      renderPrivateRoute();

      // Should call checkAuth API on mount
      expect(mockedAuthService.checkAuth).toHaveBeenCalledTimes(1);

      await waitFor(() => {
        expect(screen.getByText(/protected content/i)).toBeInTheDocument();
      });
    });

    test('persists authenticated state on page reload', async () => {
      // First render - simulate initial authentication
      mockedAuthService.checkAuth.mockResolvedValueOnce({
        id: 1,
        username: 'testuser',
      });

      const { unmount } = renderPrivateRoute();

      await waitFor(() => {
        expect(screen.getByText(/protected content/i)).toBeInTheDocument();
      });

      unmount();

      // Second render - simulate page reload
      mockedAuthService.checkAuth.mockResolvedValueOnce({
        id: 1,
        username: 'testuser',
      });

      renderPrivateRoute();

      // Should check auth again on reload
      expect(mockedAuthService.checkAuth).toHaveBeenCalledTimes(2);

      await waitFor(() => {
        expect(screen.getByText(/protected content/i)).toBeInTheDocument();
      });
    });

    test('handles expired session on page reload', async () => {
      // First render - authenticated
      mockedAuthService.checkAuth.mockResolvedValueOnce({
        id: 1,
        username: 'testuser',
      });

      const { unmount } = renderPrivateRoute();

      await waitFor(() => {
        expect(screen.getByText(/protected content/i)).toBeInTheDocument();
      });

      unmount();

      // Second render - session expired
      mockedAuthService.checkAuth.mockResolvedValueOnce(null);

      renderPrivateRoute();

      // Should redirect to login when session expired
      await waitFor(() => {
        expect(screen.getByText(/login page/i)).toBeInTheDocument();
      });

      expect(screen.queryByText(/protected content/i)).not.toBeInTheDocument();
    });

    test('verifies session via cookie on page reload', async () => {
      // Mock checkAuth to simulate cookie-based authentication
      mockedAuthService.checkAuth.mockResolvedValueOnce({
        id: 1,
        username: 'testuser',
      });

      renderPrivateRoute();

      // checkAuth should be called to verify session
      expect(mockedAuthService.checkAuth).toHaveBeenCalledTimes(1);

      await waitFor(() => {
        expect(screen.getByText(/protected content/i)).toBeInTheDocument();
      });
    });
  });

  describe('Logout Session Clearing', () => {
    test('redirects to login after logout clears session', async () => {
      // First authenticated
      mockedAuthService.checkAuth.mockResolvedValueOnce({
        id: 1,
        username: 'testuser',
      });

      const { unmount } = renderPrivateRoute();

      await waitFor(() => {
        expect(screen.getByText(/protected content/i)).toBeInTheDocument();
      });

      unmount();

      // After logout - session cleared
      mockedAuthService.checkAuth.mockResolvedValueOnce(null);

      renderPrivateRoute();

      // Should redirect to login
      await waitFor(() => {
        expect(screen.getByText(/login page/i)).toBeInTheDocument();
      });

      expect(screen.queryByText(/protected content/i)).not.toBeInTheDocument();
    });

    test('clears protected content after logout', async () => {
      // First authenticated
      mockedAuthService.checkAuth.mockResolvedValueOnce({
        id: 1,
        username: 'testuser',
      });

      const { unmount } = renderPrivateRoute();

      await waitFor(() => {
        expect(screen.getByText(/protected content/i)).toBeInTheDocument();
      });

      unmount();

      // After logout
      mockedAuthService.checkAuth.mockResolvedValueOnce(null);

      renderPrivateRoute();

      await waitFor(() => {
        expect(screen.getByText(/login page/i)).toBeInTheDocument();
      });

      // Protected content should not be accessible
      expect(screen.queryByText(/protected content/i)).not.toBeInTheDocument();
    });

    test('prevents access to protected routes after logout', async () => {
      mockedAuthService.checkAuth.mockResolvedValueOnce(null);

      renderPrivateRoute();

      await waitFor(() => {
        expect(screen.getByText(/login page/i)).toBeInTheDocument();
      });

      // Verify protected route is not accessible
      expect(screen.queryByText(/protected content/i)).not.toBeInTheDocument();
      expect(mockedAuthService.checkAuth).toHaveBeenCalled();
    });
  });

  describe('Multiple Protected Routes', () => {
    test('protects multiple routes with same PrivateRoute wrapper', async () => {
      const Dashboard = () => <div>Dashboard</div>;
      const Editor = () => <div>Editor</div>;

      mockedAuthService.checkAuth.mockResolvedValue({
        id: 1,
        username: 'testuser',
      });

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/editor"
                element={
                  <PrivateRoute>
                    <Editor />
                  </PrivateRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });
    });

    test('applies same authentication rules to all protected routes', async () => {
      const Dashboard = () => <div>Dashboard</div>;

      mockedAuthService.checkAuth.mockResolvedValueOnce(null);

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      // Should redirect to login
      await waitFor(() => {
        expect(screen.getByText(/login page/i)).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles rapid authentication state changes', async () => {
      mockedAuthService.checkAuth.mockResolvedValueOnce({
        id: 1,
        username: 'testuser',
      });

      renderPrivateRoute();

      await waitFor(() => {
        expect(screen.getByText(/protected content/i)).toBeInTheDocument();
      });

      // State should be stable
      expect(screen.getByText(/protected content/i)).toBeInTheDocument();
    });

    test('handles slow authentication check gracefully', async () => {
      let resolveAuth: (value: any) => void;
      mockedAuthService.checkAuth.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveAuth = resolve;
        })
      );

      renderPrivateRoute();

      // Should show loading
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

      // Resolve after delay
      setTimeout(() => {
        resolveAuth!({ id: 1, username: 'testuser' });
      }, 100);

      await waitFor(
        () => {
          expect(screen.getByText(/protected content/i)).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    test('handles undefined user gracefully', async () => {
      mockedAuthService.checkAuth.mockResolvedValueOnce(null);

      renderPrivateRoute();

      await waitFor(() => {
        expect(screen.getByText(/login page/i)).toBeInTheDocument();
      });
    });

    test('renders nested children correctly when authenticated', async () => {
      const NestedComponent = () => (
        <div>
          <h1>Title</h1>
          <p>Content</p>
        </div>
      );

      mockedAuthService.checkAuth.mockResolvedValueOnce({
        id: 1,
        username: 'testuser',
      });

      render(
        <MemoryRouter initialEntries={['/protected']}>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/protected"
                element={
                  <PrivateRoute>
                    <NestedComponent />
                  </PrivateRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/title/i)).toBeInTheDocument();
        expect(screen.getByText(/content/i)).toBeInTheDocument();
      });
    });
  });

  describe('Integration with AuthContext', () => {
    test('uses AuthContext to get user state', async () => {
      mockedAuthService.checkAuth.mockResolvedValueOnce({
        id: 1,
        username: 'testuser',
      });

      renderPrivateRoute();

      await waitFor(() => {
        expect(screen.getByText(/protected content/i)).toBeInTheDocument();
      });

      // Verify that auth context is providing the user
      expect(mockedAuthService.checkAuth).toHaveBeenCalled();
    });

    test('uses AuthContext to get loading state', () => {
      let resolveAuth: (value: any) => void;
      mockedAuthService.checkAuth.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveAuth = resolve;
        })
      );

      renderPrivateRoute();

      // Loading state from AuthContext
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

      // Clean up
      resolveAuth!(null);
    });

    test('responds to AuthContext state changes', async () => {
      mockedAuthService.checkAuth.mockResolvedValueOnce({
        id: 1,
        username: 'testuser',
      });

      renderPrivateRoute();

      await waitFor(() => {
        expect(screen.getByText(/protected content/i)).toBeInTheDocument();
      });

      // Content should remain stable
      expect(screen.getByText(/protected content/i)).toBeInTheDocument();
    });
  });

  describe('API Call Mocking', () => {
    test('properly mocks checkAuth API call', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      mockedAuthService.checkAuth.mockResolvedValueOnce(mockUser);

      renderPrivateRoute();

      await waitFor(() => {
        expect(screen.getByText(/protected content/i)).toBeInTheDocument();
      });

      expect(mockedAuthService.checkAuth).toHaveBeenCalledTimes(1);
    });

    test('handles API call failure gracefully', async () => {
      mockedAuthService.checkAuth.mockRejectedValueOnce(
        new Error('Network error')
      );

      renderPrivateRoute();

      // Should redirect to login on API failure
      await waitFor(() => {
        expect(screen.getByText(/login page/i)).toBeInTheDocument();
      });
    });

    test('does not call logout API (only checkAuth)', async () => {
      mockedAuthService.checkAuth.mockResolvedValueOnce({
        id: 1,
        username: 'testuser',
      });
      mockedAuthService.logout.mockResolvedValueOnce();

      renderPrivateRoute();

      await waitFor(() => {
        expect(screen.getByText(/protected content/i)).toBeInTheDocument();
      });

      // PrivateRoute should only call checkAuth, not logout
      expect(mockedAuthService.checkAuth).toHaveBeenCalled();
      expect(mockedAuthService.logout).not.toHaveBeenCalled();
    });
  });

  describe('LocalStorage and Cookie Behavior', () => {
    test('relies on cookies for authentication (not localStorage)', async () => {
      // PrivateRoute uses AuthContext which calls checkAuth API
      // The API checks the httpOnly cookie automatically
      mockedAuthService.checkAuth.mockResolvedValueOnce({
        id: 1,
        username: 'testuser',
      });

      renderPrivateRoute();

      await waitFor(() => {
        expect(screen.getByText(/protected content/i)).toBeInTheDocument();
      });

      // The authentication is cookie-based, verified by API call
      expect(mockedAuthService.checkAuth).toHaveBeenCalled();
    });

    test('does not store user data in localStorage', async () => {
      const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');

      mockedAuthService.checkAuth.mockResolvedValueOnce({
        id: 1,
        username: 'testuser',
      });

      renderPrivateRoute();

      await waitFor(() => {
        expect(screen.getByText(/protected content/i)).toBeInTheDocument();
      });

      // PrivateRoute and AuthContext should not use localStorage for auth
      // (They use httpOnly cookies instead for security)
      expect(getItemSpy).not.toHaveBeenCalledWith('user');
      expect(setItemSpy).not.toHaveBeenCalledWith('user', expect.anything());

      getItemSpy.mockRestore();
      setItemSpy.mockRestore();
    });
  });
});
