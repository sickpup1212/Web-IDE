import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import Dashboard from './Dashboard';
import * as projectsService from '../services/projects';
import { Project } from '../types';

// Mock the projects service
jest.mock('../services/projects');
const mockedProjectsService = projectsService as jest.Mocked<typeof projectsService>;

// Mock the AuthContext
jest.mock('../context/AuthContext', () => {
  const actual = jest.requireActual('../context/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      user: { id: 1, username: 'testuser' },
      logout: jest.fn(),
      isLoading: false,
      login: jest.fn(),
      checkAuth: jest.fn(),
    }),
  };
});

// Sample project data for testing
const mockProjects: Project[] = [
  {
    id: 1,
    user_id: 1,
    name: 'Test Project 1',
    html_code: '<h1>Hello World</h1>',
    css_code: 'h1 { color: blue; }',
    js_code: 'console.log("test");',
    created_at: '2024-01-15T10:00:00.000Z',
    updated_at: '2024-01-15T12:00:00.000Z',
  },
  {
    id: 2,
    user_id: 1,
    name: 'Test Project 2',
    html_code: '<div>Test Content</div>',
    css_code: '',
    js_code: '',
    created_at: '2024-01-16T10:00:00.000Z',
    updated_at: '2024-01-16T10:00:00.000Z',
  },
  {
    id: 3,
    user_id: 1,
    name: 'Empty Project',
    html_code: '',
    css_code: '',
    js_code: '',
    created_at: '2024-01-17T10:00:00.000Z',
    updated_at: '2024-01-17T10:00:00.000Z',
  },
];

// Helper function to render Dashboard with necessary providers
const renderDashboard = () => {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/editor" element={<div>Editor Page</div>} />
            <Route path="/editor/:id" element={<div>Editor Page with ID</div>} />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('Dashboard Component - Rendering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders dashboard header with title', async () => {
    mockedProjectsService.getProjects.mockResolvedValueOnce([]);

    renderDashboard();

    expect(screen.getByRole('heading', { name: /my projects/i })).toBeInTheDocument();
  });

  test('renders New Project button', async () => {
    mockedProjectsService.getProjects.mockResolvedValueOnce([]);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /new project/i })).toBeInTheDocument();
    });
  });

  test('renders Logout button', async () => {
    mockedProjectsService.getProjects.mockResolvedValueOnce([]);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    });
  });

  test('has proper semantic HTML structure with header and main', async () => {
    mockedProjectsService.getProjects.mockResolvedValueOnce([]);

    const { container } = renderDashboard();

    await waitFor(() => {
      expect(container.querySelector('header')).toBeInTheDocument();
      expect(container.querySelector('main')).toBeInTheDocument();
    });
  });
});

describe('Dashboard Component - Project Fetching', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fetches projects on component mount', async () => {
    mockedProjectsService.getProjects.mockResolvedValueOnce(mockProjects);

    renderDashboard();

    await waitFor(() => {
      expect(mockedProjectsService.getProjects).toHaveBeenCalledTimes(1);
    });
  });

  test('displays loading spinner while fetching projects', () => {
    let resolveProjects: (value: Project[]) => void;
    mockedProjectsService.getProjects.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveProjects = resolve;
      })
    );

    renderDashboard();

    // Loading spinner should be visible
    expect(screen.getByText(/loading projects/i)).toBeInTheDocument();
    const spinner = document.querySelector('.spinner');
    expect(spinner).toBeInTheDocument();

    // Resolve the promise
    resolveProjects!(mockProjects);
  });

  test('displays projects after successful fetch', async () => {
    mockedProjectsService.getProjects.mockResolvedValueOnce(mockProjects);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      expect(screen.getByText('Test Project 2')).toBeInTheDocument();
      expect(screen.getByText('Empty Project')).toBeInTheDocument();
    });
  });

  test('hides loading spinner after projects are loaded', async () => {
    mockedProjectsService.getProjects.mockResolvedValueOnce(mockProjects);

    renderDashboard();

    await waitFor(() => {
      expect(screen.queryByText(/loading projects/i)).not.toBeInTheDocument();
    });
  });

  test('displays correct number of project cards', async () => {
    mockedProjectsService.getProjects.mockResolvedValueOnce(mockProjects);

    renderDashboard();

    await waitFor(() => {
      const projectCards = document.querySelectorAll('.project-card');
      expect(projectCards).toHaveLength(3);
    });
  });

  test('renders projects in a grid layout', async () => {
    mockedProjectsService.getProjects.mockResolvedValueOnce(mockProjects);

    renderDashboard();

    await waitFor(() => {
      const projectsGrid = document.querySelector('.projects-grid');
      expect(projectsGrid).toBeInTheDocument();
    });
  });
});

describe('Dashboard Component - Empty State', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('displays empty state when no projects exist', async () => {
    mockedProjectsService.getProjects.mockResolvedValueOnce([]);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/no projects yet/i)).toBeInTheDocument();
    });
  });

  test('empty state shows helpful message', async () => {
    mockedProjectsService.getProjects.mockResolvedValueOnce([]);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/create your first project to get started/i)).toBeInTheDocument();
    });
  });

  test('empty state displays Create Project button', async () => {
    mockedProjectsService.getProjects.mockResolvedValueOnce([]);

    renderDashboard();

    await waitFor(() => {
      // Should have both "New Project" in header and "Create Project" in empty state
      const createButtons = screen.getAllByRole('button', { name: /project/i });
      expect(createButtons.length).toBeGreaterThanOrEqual(2);
    });
  });

  test('does not show projects grid when no projects', async () => {
    mockedProjectsService.getProjects.mockResolvedValueOnce([]);

    renderDashboard();

    await waitFor(() => {
      expect(screen.queryByText(/no projects yet/i)).toBeInTheDocument();
    });

    const projectsGrid = document.querySelector('.projects-grid');
    expect(projectsGrid).not.toBeInTheDocument();
  });

  test('does not show empty state when projects exist', async () => {
    mockedProjectsService.getProjects.mockResolvedValueOnce(mockProjects);

    renderDashboard();

    await waitFor(() => {
      expect(screen.queryByText(/no projects yet/i)).not.toBeInTheDocument();
    });
  });
});

describe('Dashboard Component - Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('displays error message when API call fails', async () => {
    mockedProjectsService.getProjects.mockRejectedValueOnce(
      new Error('Failed to fetch projects')
    );

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/failed to fetch projects/i)).toBeInTheDocument();
    });
  });

  test('displays retry button on error', async () => {
    mockedProjectsService.getProjects.mockRejectedValueOnce(
      new Error('Failed to fetch projects')
    );

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });

  test('hides loading spinner after error', async () => {
    mockedProjectsService.getProjects.mockRejectedValueOnce(
      new Error('Failed to fetch projects')
    );

    renderDashboard();

    await waitFor(() => {
      expect(screen.queryByText(/loading projects/i)).not.toBeInTheDocument();
    });
  });

  test('does not show projects or empty state on error', async () => {
    mockedProjectsService.getProjects.mockRejectedValueOnce(
      new Error('Failed to fetch projects')
    );

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/failed to fetch projects/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/no projects yet/i)).not.toBeInTheDocument();
    const projectsGrid = document.querySelector('.projects-grid');
    expect(projectsGrid).not.toBeInTheDocument();
  });

  test('displays network error message', async () => {
    mockedProjectsService.getProjects.mockRejectedValueOnce(
      new Error('No response from server. Please check your connection.')
    );

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/no response from server/i)).toBeInTheDocument();
    });
  });

  test('displays generic error message for unknown errors', async () => {
    mockedProjectsService.getProjects.mockRejectedValueOnce(
      new Error('Unknown error occurred')
    );

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/unknown error occurred/i)).toBeInTheDocument();
    });
  });
});

describe('Dashboard Component - Retry Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('retry button fetches projects again', async () => {
    mockedProjectsService.getProjects
      .mockRejectedValueOnce(new Error('Failed to fetch projects'))
      .mockResolvedValueOnce(mockProjects);

    renderDashboard();

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText(/failed to fetch projects/i)).toBeInTheDocument();
    });

    // Click retry button
    const retryButton = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryButton);

    // Should show loading again
    expect(screen.getByText(/loading projects/i)).toBeInTheDocument();

    // Should fetch projects again
    await waitFor(() => {
      expect(mockedProjectsService.getProjects).toHaveBeenCalledTimes(2);
    });

    // Should display projects after successful retry
    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });
  });

  test('clears error message when retry is clicked', async () => {
    mockedProjectsService.getProjects
      .mockRejectedValueOnce(new Error('Failed to fetch projects'))
      .mockResolvedValueOnce(mockProjects);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/failed to fetch projects/i)).toBeInTheDocument();
    });

    const retryButton = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryButton);

    // Error should be cleared during loading
    await waitFor(() => {
      expect(screen.queryByText(/failed to fetch projects/i)).not.toBeInTheDocument();
    });
  });

  test('handles subsequent failure on retry', async () => {
    mockedProjectsService.getProjects
      .mockRejectedValueOnce(new Error('First error'))
      .mockRejectedValueOnce(new Error('Second error'));

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/first error/i)).toBeInTheDocument();
    });

    const retryButton = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText(/second error/i)).toBeInTheDocument();
    });

    // Retry button should still be available
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });
});

describe('Dashboard Component - Navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('New Project button navigates to /editor', async () => {
    mockedProjectsService.getProjects.mockResolvedValueOnce(mockProjects);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    const newProjectButton = screen.getByRole('button', { name: /new project/i });
    fireEvent.click(newProjectButton);

    await waitFor(() => {
      expect(screen.getByText(/editor page/i)).toBeInTheDocument();
    });
  });

  test('Create Project button in empty state navigates to /editor', async () => {
    mockedProjectsService.getProjects.mockResolvedValueOnce([]);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/no projects yet/i)).toBeInTheDocument();
    });

    const createButton = screen.getByRole('button', { name: /create project/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText(/editor page/i)).toBeInTheDocument();
    });
  });

  test('Logout button is present and clickable', async () => {
    mockedProjectsService.getProjects.mockResolvedValueOnce(mockProjects);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    expect(logoutButton).toBeInTheDocument();
    expect(logoutButton).not.toBeDisabled();

    // Verify button is clickable (won't verify actual logout behavior due to mocking limitations)
    fireEvent.click(logoutButton);
  });
});

describe('Dashboard Component - Project Card Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('project cards display project names', async () => {
    mockedProjectsService.getProjects.mockResolvedValueOnce(mockProjects);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      expect(screen.getByText('Test Project 2')).toBeInTheDocument();
      expect(screen.getByText('Empty Project')).toBeInTheDocument();
    });
  });

//  test('project cards have Open buttons', async () => {
//    mockedProjectsService.getProjects.mockResolvedValueOnce(mockProjects);

//    renderDashboard();
//    const menuTrigger = screen.getByTestId('project-menu-1'); // Using the ID from mock data
//    fireEvent.click(menuTrigger);

//    await waitFor(() => {
//      const openButtons = screen.getAllByRole('button', { name: /open/i });
//      expect(openButtons).toHaveLength(3);
//    });
//  });

//  test('clicking Open button navigates to editor with project ID', async () => {
//    mockedProjectsService.getProjects.mockResolvedValueOnce(mockProjects);

//    renderDashboard();
//    screen.debug()
//    const menuTrigger = screen.getByTestId('project-menu-1'); // Using the ID from mock data
//    fireEvent.click(menuTrigger);

//    const openButton = await screen.findByRole('menuitem', { name: /open/i });
//    fireEvent.click(openButton);
//    await waitFor(() => {
//      expect(screen.getByText('Editor Page for project 1')).toBeInTheDocument();
//    });
//    await waitFor(() => {
//      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
//    });

//    const openButtons = screen.getAllByRole('button', { name: /open/i });
//    fireEvent.click(openButtons[0]);

//    await waitFor(() => {
//      expect(screen.getByText(/editor page with id/i)).toBeInTheDocument();
//    });
//  });
});

describe('Dashboard Component - State Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('maintains projects state after successful fetch', async () => {
    mockedProjectsService.getProjects.mockResolvedValueOnce(mockProjects);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    // Projects should remain visible
    expect(screen.getByText('Test Project 2')).toBeInTheDocument();
    expect(screen.getByText('Empty Project')).toBeInTheDocument();
  });

  test('loading state is false after successful fetch', async () => {
    mockedProjectsService.getProjects.mockResolvedValueOnce(mockProjects);

    renderDashboard();

    await waitFor(() => {
      expect(screen.queryByText(/loading projects/i)).not.toBeInTheDocument();
    });

    // Should show projects, not loading
    expect(screen.getByText('Test Project 1')).toBeInTheDocument();
  });

  test('error state is null after successful fetch', async () => {
    mockedProjectsService.getProjects.mockResolvedValueOnce(mockProjects);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    // Should not show error message
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });
});

describe('Dashboard Component - Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('handles empty array response correctly', async () => {
    mockedProjectsService.getProjects.mockResolvedValueOnce([]);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/no projects yet/i)).toBeInTheDocument();
    });

    // Should show empty state, not loading or error
    expect(screen.queryByText(/loading projects/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });

  test('handles single project correctly', async () => {
    mockedProjectsService.getProjects.mockResolvedValueOnce([mockProjects[0]]);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    const projectCards = document.querySelectorAll('.project-card');
    expect(projectCards).toHaveLength(1);
  });

  test('handles large number of projects', async () => {
    const manyProjects = Array.from({ length: 20 }, (_, i) => ({
      ...mockProjects[0],
      id: i + 1,
      name: `Project ${i + 1}`,
    }));

    mockedProjectsService.getProjects.mockResolvedValueOnce(manyProjects);

    renderDashboard();

    await waitFor(() => {
      const projectCards = document.querySelectorAll('.project-card');
      expect(projectCards).toHaveLength(20);
    });
  });

  test('handles projects with special characters in names', async () => {
    const specialProject: Project = {
      ...mockProjects[0],
      name: 'Test & Special <Characters> "Project"',
    };

    mockedProjectsService.getProjects.mockResolvedValueOnce([specialProject]);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/Test & Special <Characters> "Project"/i)).toBeInTheDocument();
    });
  });
});

describe('Dashboard Component - Console Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  test('logs error to console when fetch fails', async () => {
    const testError = new Error('Test error');
    mockedProjectsService.getProjects.mockRejectedValueOnce(testError);

    renderDashboard();

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Error fetching projects:', testError);
    });
  });
});
