import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Register from './Register'; // Adjust path to your component
import { useAuth } from '../context/AuthContext'; // Adjust path to your context
import { register } from '../services/auth'; // Adjust path to your service

// Mock the dependencies
jest.mock('../context/AuthContext');
jest.mock('../services/auth');

// We need components to render for our destination routes
const MockDashboard = () => <div>Dashboard Page</div>;
const MockLogin = () => <div>Login Page</div>;

describe('Register Component', () => {
  // Cast the mocked modules/hooks to the correct type for TypeScript
  const mockedUseAuth = useAuth as jest.Mock;
  const mockedRegister = register as jest.Mock;

  // Reset mocks before each test to ensure a clean state
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test Case 1: Renders the form correctly for a new user
  it('should render the registration form for a new user', () => {
    mockedUseAuth.mockReturnValue({ user: null, isLoading: false });
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  // Test Case 2: Redirects if a user is already logged in
  it('should redirect to dashboard if user is already logged in', () => {
    mockedUseAuth.mockReturnValue({ user: { id: 1 }, isLoading: false });
    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<MockDashboard />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /create account/i })).not.toBeInTheDocument();
  });

  // Test Case 3: Shows real-time validation errors for the username
  it('should show validation errors as user types in the username field', async () => {
    mockedUseAuth.mockReturnValue({ user: null, isLoading: false });
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    const usernameInput = screen.getByLabelText(/username/i);

    // Test for "too short" error
    fireEvent.change(usernameInput, { target: { value: 'a' } });
    expect(await screen.findByText('Username must be at least 3 characters')).toBeInTheDocument();

    // Test for "invalid characters" error
    fireEvent.change(usernameInput, { target: { value: 'users!' } });
    expect(await screen.findByText('Username can only contain letters, numbers, and underscores')).toBeInTheDocument();
    
    // Test that error disappears with valid input
    fireEvent.change(usernameInput, { target: { value: 'valid_user' } });
    await waitFor(() => {
      expect(screen.queryByText(/username must be/i)).not.toBeInTheDocument();
    });
  });

  // Test Case 4: Shows a validation error for a short password
  it('should show a validation error for a password that is too short', async () => {
    mockedUseAuth.mockReturnValue({ user: null, isLoading: false });
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    const passwordInput = screen.getByLabelText(/password/i);
    fireEvent.change(passwordInput, { target: { value: '12345' } });

    expect(await screen.findByText('Password must be at least 8 characters')).toBeInTheDocument();
  });

  // Test Case 5: Handles successful registration
  it('should call register service and navigate to login on successful submission', async () => {
    mockedUseAuth.mockReturnValue({ user: null, isLoading: false });
    mockedRegister.mockResolvedValue({ id: 1, username: 'newuser' }); // Simulate successful API call

    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<MockLogin />} />
        </Routes>
      </MemoryRouter>
    );

    // Simulate user input
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    // Wait for async operations
    await waitFor(() => {
      // Check if the register service was called correctly
      expect(mockedRegister).toHaveBeenCalledWith('newuser', 'password123');
    });

    // Check for navigation to the login page
    expect(await screen.findByText('Login Page')).toBeInTheDocument();
  });
  
  // Test Case 6: Handles failed registration from the API
  it('should display an API error message on failed registration', async () => {
    mockedUseAuth.mockReturnValue({ user: null, isLoading: false });
    mockedRegister.mockRejectedValue(new Error('Username already exists')); // Simulate failed API call

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'existinguser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    // Check that the API error message is displayed
    expect(await screen.findByText('Username already exists')).toBeInTheDocument();
  });
  
  // Test Case 7: Prevents submission if client-side validation fails
  it('should not call register service if form is invalid on submit', async () => {
    mockedUseAuth.mockReturnValue({ user: null, isLoading: false });
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    // Leave fields empty and submit
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    // Check that validation errors appear
    expect(await screen.findByText('Username is required')).toBeInTheDocument();
    expect(await screen.findByText('Password is required')).toBeInTheDocument();
    
    // Crucially, check that the API was never called
    expect(mockedRegister).not.toHaveBeenCalled();
  });
});
