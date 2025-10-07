import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import Login from './Login';
import * as authService from '../services/auth';

// Mock the auth service
jest.mock('../services/auth');
const mockedAuthService = authService as jest.Mocked<typeof authService>;

// Helper function to render Login with necessary providers
const renderLogin = (initialState?: any) => {
  const initialEntries = initialState
    ? [{ pathname: '/login', state: initialState }]
    : ['/login'];

  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<div>Register Page</div>} />
          <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('Login Component - Rendering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders login form with all required elements', () => {
    renderLogin();

    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
  });

  test('displays success message when redirected from registration', () => {
    renderLogin({ message: 'Registration successful! Please log in.' });

    expect(screen.getByText(/registration successful/i)).toBeInTheDocument();
  });

  test('password field has type="password"', () => {
    renderLogin();

    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('password field has proper autocomplete attribute', () => {
    renderLogin();

    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
  });
});

describe('Login Component - Form Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows error when submitting with empty username', async () => {
    renderLogin();

    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    // Only fill password
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/please enter both username and password/i)).toBeInTheDocument();
    });

    // Should not call login API
    expect(mockedAuthService.login).not.toHaveBeenCalled();
  });

  test('shows error when submitting with empty password', async () => {
    renderLogin();

    const usernameInput = screen.getByLabelText(/username/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    // Only fill username
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.click(submitButton);

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/please enter both username and password/i)).toBeInTheDocument();
    });

    // Should not call login API
    expect(mockedAuthService.login).not.toHaveBeenCalled();
  });

  test('shows error when submitting with both fields empty', async () => {
    renderLogin();

    const submitButton = screen.getByRole('button', { name: /log in/i });
    fireEvent.click(submitButton);

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/please enter both username and password/i)).toBeInTheDocument();
    });

    // Should not call login API
    expect(mockedAuthService.login).not.toHaveBeenCalled();
  });

  test('clears error message when user starts typing', () => {
    renderLogin();

    const usernameInput = screen.getByLabelText(/username/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    // Create an error
    fireEvent.click(submitButton);

    // Error should be visible
    expect(screen.getByText(/please enter both username and password/i)).toBeInTheDocument();

    // Start typing
    fireEvent.change(usernameInput, { target: { value: 't' } });

    // Error should be cleared
    expect(screen.queryByText(/please enter both username and password/i)).not.toBeInTheDocument();
  });
});

describe('Login Component - Form Submission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('submits form successfully with valid credentials', async () => {
    mockedAuthService.login.mockResolvedValueOnce({
      user: { id: 1, username: 'testuser' }
    });

    renderLogin();

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    // Enter valid credentials
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    // Should call login API with correct credentials
    await waitFor(() => {
      expect(mockedAuthService.login).toHaveBeenCalledWith('testuser', 'password123');
    });

    // Should redirect to dashboard
    await waitFor(() => {
      expect(screen.getByText(/dashboard page/i)).toBeInTheDocument();
    });
  });

  test('shows loading spinner during form submission', async () => {
    let resolveLogin: (value: any) => void;
    mockedAuthService.login.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveLogin = resolve;
      })
    );

    renderLogin();

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    // Button should be disabled during loading
    expect(submitButton).toBeDisabled();

    // Resolve the promise
    resolveLogin!({ user: { id: 1, username: 'testuser' } });

    await waitFor(() => {
      expect(screen.getByText(/dashboard page/i)).toBeInTheDocument();
    });
  });

  test('disables form inputs during submission', async () => {
    let resolveLogin: (value: any) => void;
    mockedAuthService.login.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveLogin = resolve;
      })
    );

    renderLogin();

    const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /log in/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    // Inputs should be disabled during loading
    expect(usernameInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();

    // Resolve the promise
    resolveLogin!({ user: { id: 1, username: 'testuser' } });

    await waitFor(() => {
      expect(screen.getByText(/dashboard page/i)).toBeInTheDocument();
    });
  });

  test('handles login failure with invalid credentials', async () => {
    mockedAuthService.login.mockRejectedValueOnce(
      new Error('Invalid username or password')
    );

    renderLogin();

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    fireEvent.change(usernameInput, { target: { value: 'wronguser' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
    fireEvent.click(submitButton);

    // Should display error message
    await waitFor(() => {
      expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument();
    });

    // Should not redirect
    expect(screen.queryByText(/dashboard page/i)).not.toBeInTheDocument();
  });

  test('handles login failure with wrong password', async () => {
    mockedAuthService.login.mockRejectedValueOnce(
      new Error('Invalid username or password')
    );

    renderLogin();

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    // Should display error message
    await waitFor(() => {
      expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument();
    });
  });

  test('handles generic server error', async () => {
    mockedAuthService.login.mockRejectedValueOnce(
      new Error('Server error occurred')
    );

    renderLogin();

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/server error occurred/i)).toBeInTheDocument();
    });
  });

  test('handles network error', async () => {
    mockedAuthService.login.mockRejectedValueOnce(
      new Error('Network error')
    );

    renderLogin();

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });
});

describe('Login Component - Error Display', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('displays error message in visible alert box', async () => {
    mockedAuthService.login.mockRejectedValueOnce(
      new Error('Login failed')
    );

    renderLogin();

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      const errorAlert = screen.getByText(/login failed/i);
      expect(errorAlert).toBeInTheDocument();
      expect(errorAlert).toHaveClass('error-alert');
    });
  });

  test('clears error when user types in username field', async () => {
    mockedAuthService.login.mockRejectedValueOnce(
      new Error('Login failed')
    );

    renderLogin();

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    // Submit and get error
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/login failed/i)).toBeInTheDocument();
    });

    // Start typing in username - error should clear
    fireEvent.change(usernameInput, { target: { value: 'testuser2' } });
    expect(screen.queryByText(/login failed/i)).not.toBeInTheDocument();
  });

  test('clears error when user types in password field', async () => {
    mockedAuthService.login.mockRejectedValueOnce(
      new Error('Login failed')
    );

    renderLogin();

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    // Submit and get error
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/login failed/i)).toBeInTheDocument();
    });

    // Start typing in password - error should clear
    fireEvent.change(passwordInput, { target: { value: 'password1234' } });
    expect(screen.queryByText(/login failed/i)).not.toBeInTheDocument();
  });
});

describe('Login Component - Navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('navigates to register page when clicking sign up link', () => {
    renderLogin();

    const signUpLink = screen.getByRole('link', { name: /sign up/i });
    expect(signUpLink).toHaveAttribute('href', '/register');

    fireEvent.click(signUpLink);

    // Should navigate to register page
    expect(screen.getByText(/register page/i)).toBeInTheDocument();
  });

  test('sign up link is accessible and properly styled', () => {
    renderLogin();

    const signUpLink = screen.getByRole('link', { name: /sign up/i });
    expect(signUpLink).toBeVisible();
    expect(signUpLink).toBeInTheDocument();
  });
});

describe('Login Component - Accessibility', () => {
  test('form inputs have associated labels', () => {
    renderLogin();

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);

    expect(usernameInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
  });

  test('form has noValidate attribute to use custom validation', () => {
    renderLogin();

    const form = screen.getByRole('button', { name: /log in/i }).closest('form');
    expect(form).toHaveAttribute('noValidate');
  });

  test('submit button has proper type attribute', () => {
    renderLogin();

    const submitButton = screen.getByRole('button', { name: /log in/i });
    expect(submitButton).toHaveAttribute('type', 'submit');
  });

  test('username input has proper autocomplete attribute', () => {
    renderLogin();

    const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
    expect(usernameInput).toHaveAttribute('autocomplete', 'username');
  });
});

describe('Login Component - Success Message from Registration', () => {
  test('success message is displayed with appropriate styling', () => {
    renderLogin({ message: 'Registration successful! Please log in.' });

    const successMessage = screen.getByText(/registration successful/i);
    expect(successMessage).toBeInTheDocument();
    expect(successMessage).toHaveClass('error-alert');
  });

  test('success message does not interfere with form submission', async () => {
    mockedAuthService.login.mockResolvedValueOnce({
      user: { id: 1, username: 'testuser' }
    });

    renderLogin({ message: 'Registration successful! Please log in.' });

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    // Success message should be visible
    expect(screen.getByText(/registration successful/i)).toBeInTheDocument();

    // Should still be able to submit form
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/dashboard page/i)).toBeInTheDocument();
    });
  });
});

describe('Login Component - Integration with AuthContext', () => {
  test('calls AuthContext login method on successful submission', async () => {
    mockedAuthService.login.mockResolvedValueOnce({
      user: { id: 1, username: 'testuser' }
    });

    renderLogin();

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockedAuthService.login).toHaveBeenCalledWith('testuser', 'password123');
    });
  });
});
