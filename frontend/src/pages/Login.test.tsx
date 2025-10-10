import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Login from './Login'; // Adjust path to your component
import { useAuth } from '../context/AuthContext'; // Adjust path to your context

jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockUser = { id: '1', username: 'testuser' };

const MockDashboard = () => <div>Dashboard Page</div>;
const MockRegister = () => <div>Register Page</div>;


describe('Login Component', () => {
  const mockedUseAuth = useAuth as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the login form for a new user', () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      isAuthLoading: false,
      login: jest.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByText(/don't have an account?/i)).toBeInTheDocument();
  });

  it('should show a loading spinner if auth status is loading', () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      isLoading: true, 
      login: jest.fn(),
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.queryByRole('heading', { name: /welcome back/i })).not.toBeInTheDocument();
  });

  it('should redirect to dashboard if user is already logged in', () => {
    mockedUseAuth.mockReturnValue({
      user: mockUser, 
      isAuthLoading: false,
      login: jest.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<MockDashboard />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /welcome back/i })).not.toBeInTheDocument();
  });

  it('should call login function and navigate to dashboard on successful login', async () => {
    const mockLogin = jest.fn().mockResolvedValue(mockUser);
    mockedUseAuth.mockReturnValue({
      user: null,
      isAuthLoading: false,
      login: mockLogin,
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<MockDashboard />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123');
    });

    await waitFor(() => {
      expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
    });
  });

  it('should display an error message on failed login', async () => {
    const mockLogin = jest.fn().mockRejectedValue(new Error('Invalid username or password'));
    mockedUseAuth.mockReturnValue({
      user: null,
      isAuthLoading: false,
      login: mockLogin,
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'wronguser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    const errorMessage = await screen.findByText('Invalid username or password');
    expect(errorMessage).toBeInTheDocument();
  });

  it('should show validation error if fields are empty and not call login', async () => {
    const mockLogin = jest.fn();
    mockedUseAuth.mockReturnValue({
      user: null,
      isAuthLoading: false,
      login: mockLogin,
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText('Please enter both username and password')).toBeInTheDocument();

    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('should display success message from location state', () => {
    mockedUseAuth.mockReturnValue({ user: null, isAuthLoading: false });

    const successState = { message: 'Registration successful! Please log in.' };
    render(
      <MemoryRouter initialEntries={[{ pathname: '/login', state: successState }]}>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByText(successState.message)).toBeInTheDocument();
  });
});
