import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';

// Test component that wraps routes for testing
const TestApp = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/editor/:id?" element={<Editor />} />
      </Routes>
    </AuthProvider>
  );
};

describe('App Routing', () => {
  test('root path redirects to /login', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <TestApp />
      </MemoryRouter>
    );

    // Should show login page content
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
  });

  test('renders Login component at /login', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <TestApp />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
  });

  test('renders Register component at /register', () => {
    render(
      <MemoryRouter initialEntries={['/register']}>
        <TestApp />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
  });

  test('renders Dashboard component at /dashboard', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <TestApp />
      </MemoryRouter>
    );

    expect(screen.getByText(/dashboard page/i)).toBeInTheDocument();
  });

  test('renders Editor component at /editor', () => {
    render(
      <MemoryRouter initialEntries={['/editor']}>
        <TestApp />
      </MemoryRouter>
    );

    expect(screen.getByText(/editor page/i)).toBeInTheDocument();
  });

  test('renders Editor component at /editor/:id', () => {
    render(
      <MemoryRouter initialEntries={['/editor/123']}>
        <TestApp />
      </MemoryRouter>
    );

    expect(screen.getByText(/editor page/i)).toBeInTheDocument();
  });
});
