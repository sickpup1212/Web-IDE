import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import Register from './Register';
import * as authService from '../services/auth';

// Mock the auth service
jest.mock('../services/auth');
const mockedAuthService = authService as jest.Mocked<typeof authService>;

// Helper function to render Register with necessary providers
const renderRegister = () => {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <AuthProvider>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('Register Component - Form Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders registration form with all required elements', () => {
    renderRegister();

    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument();
  });

  test('validates username minimum length (3 characters)', () => {
    renderRegister();

    const usernameInput = screen.getByLabelText(/username/i);

    // Test with 1 character
    fireEvent.change(usernameInput, { target: { value: 'ab' } });
    expect(screen.getByText(/username must be at least 3 characters/i)).toBeInTheDocument();

    // Test with 3 characters - should clear error
    fireEvent.change(usernameInput, { target: { value: 'abc' } });
    expect(screen.queryByText(/username must be at least 3 characters/i)).not.toBeInTheDocument();
  });

  test('validates username maximum length (255 characters)', () => {
    renderRegister();

    const usernameInput = screen.getByLabelText(/username/i);
    const longUsername = 'a'.repeat(256);

    fireEvent.change(usernameInput, { target: { value: longUsername } });
    expect(screen.getByText(/username must be less than 255 characters/i)).toBeInTheDocument();

    // Test with exactly 255 characters - should be valid
    const validUsername = 'a'.repeat(255);
    fireEvent.change(usernameInput, { target: { value: validUsername } });
    expect(screen.queryByText(/username must be less than 255 characters/i)).not.toBeInTheDocument();
  });

  test('validates username format (alphanumeric and underscores only)', () => {
    renderRegister();

    const usernameInput = screen.getByLabelText(/username/i);

    // Test invalid characters
    fireEvent.change(usernameInput, { target: { value: 'user@name' } });
    expect(screen.getByText(/username can only contain letters, numbers, and underscores/i)).toBeInTheDocument();

    fireEvent.change(usernameInput, { target: { value: 'user-name' } });
    expect(screen.getByText(/username can only contain letters, numbers, and underscores/i)).toBeInTheDocument();

    fireEvent.change(usernameInput, { target: { value: 'user name' } });
    expect(screen.getByText(/username can only contain letters, numbers, and underscores/i)).toBeInTheDocument();

    // Test valid format
    fireEvent.change(usernameInput, { target: { value: 'valid_user123' } });
    expect(screen.queryByText(/username can only contain letters, numbers, and underscores/i)).not.toBeInTheDocument();
  });

  test('validates password minimum length (8 characters)', () => {
    renderRegister();

    const passwordInput = screen.getByLabelText(/password/i);

    // Test with 7 characters
    fireEvent.change(passwordInput, { target: { value: 'pass123' } });
    expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();

    // Test with 8 characters - should clear error
    fireEvent.change(passwordInput, { target: { value: 'pass1234' } });
    expect(screen.queryByText(/password must be at least 8 characters/i)).not.toBeInTheDocument();
  });

  test('shows required error messages when fields are empty', () => {
    renderRegister();

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);

    // Touch and clear username
    fireEvent.change(usernameInput, { target: { value: 'test' } });
    fireEvent.change(usernameInput, { target: { value: '' } });
    expect(screen.getByText(/username is required/i)).toBeInTheDocument();

    // Touch and clear password
    fireEvent.change(passwordInput, { target: { value: 'test' } });
    fireEvent.change(passwordInput, { target: { value: '' } });
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  test('prevents form submission when validation errors exist', async () => {
    renderRegister();

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    // Enter invalid data
    fireEvent.change(usernameInput, { target: { value: 'ab' } });
    fireEvent.change(passwordInput, { target: { value: 'short' } });
    fireEvent.click(submitButton);

    // Should show validation errors
    expect(screen.getByText(/username must be at least 3 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();

    // Should not call register API
    expect(mockedAuthService.register).not.toHaveBeenCalled();
  });

  test('clears validation errors when user starts typing', () => {
    renderRegister();

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);

    // Create validation errors
    fireEvent.change(usernameInput, { target: { value: 'ab' } });
    fireEvent.change(passwordInput, { target: { value: 'short' } });

    expect(screen.getByText(/username must be at least 3 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();

    // Start typing valid values
    fireEvent.change(usernameInput, { target: { value: 'validuser' } });
    fireEvent.change(passwordInput, { target: { value: 'validpass123' } });

    // Errors should be cleared
    expect(screen.queryByText(/username must be at least 3 characters/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/password must be at least 8 characters/i)).not.toBeInTheDocument();
  });
});

describe('Register Component - Form Submission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('submits form successfully with valid data', async () => {
    mockedAuthService.register.mockResolvedValueOnce({
      user: { id: 1, username: 'testuser' }
    });

    renderRegister();

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    // Enter valid credentials
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    // Should show loading state (button still exists but content changes)
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });

    // Wait for API call
    await waitFor(() => {
      expect(mockedAuthService.register).toHaveBeenCalledWith('testuser', 'password123');
    });

    // Should redirect to login page
    await waitFor(() => {
      expect(screen.getByText(/login page/i)).toBeInTheDocument();
    });
  });

  test('shows loading spinner during form submission', async () => {
    let resolveRegister: (value: any) => void;
    mockedAuthService.register.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRegister = resolve;
      })
    );

    renderRegister();

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    // Button should be disabled during loading
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });

    // Resolve the promise
    resolveRegister!({ user: { id: 1, username: 'testuser' } });

    await waitFor(() => {
      expect(screen.getByText(/login page/i)).toBeInTheDocument();
    });
  });

  test('disables form inputs during submission', async () => {
    let resolveRegister: (value: any) => void;
    mockedAuthService.register.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRegister = resolve;
      })
    );

    renderRegister();

    const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    // Inputs should be disabled during loading
    expect(usernameInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();

    // Resolve the promise
    resolveRegister!({ user: { id: 1, username: 'testuser' } });

    await waitFor(() => {
      expect(screen.getByText(/login page/i)).toBeInTheDocument();
    });
  });

  test('handles registration failure with duplicate username', async () => {
    mockedAuthService.register.mockRejectedValueOnce(
      new Error('Username already exists')
    );

    renderRegister();

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    fireEvent.change(usernameInput, { target: { value: 'existinguser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    // Should display error message
    await waitFor(() => {
      expect(screen.getByText(/username already exists/i)).toBeInTheDocument();
    });

    // Should not redirect
    expect(screen.queryByText(/login page/i)).not.toBeInTheDocument();
  });

  test('handles generic registration error', async () => {
    mockedAuthService.register.mockRejectedValueOnce(
      new Error('Server error occurred')
    );

    renderRegister();

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/server error occurred/i)).toBeInTheDocument();
    });
  });

  test('clears API error when user starts typing', async () => {
    mockedAuthService.register.mockRejectedValueOnce(
      new Error('Registration failed')
    );

    renderRegister();

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    // Submit and get error
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/registration failed/i)).toBeInTheDocument();
    });

    // Start typing - error should clear
    fireEvent.change(usernameInput, { target: { value: 'testuser2' } });
    expect(screen.queryByText(/registration failed/i)).not.toBeInTheDocument();
  });
});

describe('Register Component - Navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('navigates to login page when clicking login link', () => {
    renderRegister();

    const loginLink = screen.getByRole('link', { name: /log in/i });
    expect(loginLink).toHaveAttribute('href', '/login');

    fireEvent.click(loginLink);

    // Should navigate to login page
    expect(screen.getByText(/login page/i)).toBeInTheDocument();
  });

  test('login link is accessible and properly styled', () => {
    renderRegister();

    const loginLink = screen.getByRole('link', { name: /log in/i });
    expect(loginLink).toBeVisible();
    expect(loginLink).toBeInTheDocument();
  });
});

describe('Register Component - Password Field Security', () => {
  test('password field has type="password"', () => {
    renderRegister();

    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('password field has proper autocomplete attribute', () => {
    renderRegister();

    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    expect(passwordInput).toHaveAttribute('autocomplete', 'new-password');
  });
});

describe('Register Component - Accessibility', () => {
  test('form inputs have associated labels', () => {
    renderRegister();

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);

    expect(usernameInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
  });

  test('form has noValidate attribute to use custom validation', () => {
    renderRegister();

    const form = screen.getByRole('button', { name: /sign up/i }).closest('form');
    expect(form).toHaveAttribute('noValidate');
  });

  test('error messages are properly associated with inputs', () => {
    renderRegister();

    const usernameInput = screen.getByLabelText(/username/i);

    // Create an error
    fireEvent.change(usernameInput, { target: { value: 'ab' } });

    // Error message should be visible
    const errorMessage = screen.getByText(/username must be at least 3 characters/i);
    expect(errorMessage).toBeInTheDocument();
  });
});
