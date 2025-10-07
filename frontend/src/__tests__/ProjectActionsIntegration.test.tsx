import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import { ToastProvider } from '../context/ToastContext';
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

// Sample project data
const mockProjects: Project[] = [
  {
    id: 1,
    user_id: 1,
    name: 'Test Project 1',
    html_code: '<h1>Hello</h1>',
    css_code: 'h1 { color: blue; }',
    js_code: '',
    created_at: '2024-01-15T10:00:00.000Z',
    updated_at: '2024-01-15T12:00:00.000Z',
  },
  {
    id: 2,
    user_id: 1,
    name: 'Test Project 2',
    html_code: '<div>Test</div>',
    css_code: '',
    js_code: '',
    created_at: '2024-01-16T10:00:00.000Z',
    updated_at: '2024-01-16T10:00:00.000Z',
  },
];

// Helper to render Dashboard with all providers
const renderDashboard = () => {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <Dashboard />
      </ToastProvider>
    </MemoryRouter>
  );
};

describe('Project Actions Integration - Dropdown Menu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('opens dropdown menu when three-dot icon is clicked', async () => {
    mockedProjectsService.getProjects.mockResolvedValueOnce(mockProjects);

    const { container } = renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    // Find the dropdown trigger (three-dot menu icon) in the first project card
    const projectCards = container.querySelectorAll('.project-card');
    const firstCard = projectCards[0];
    const dropdownTrigger = firstCard.querySelector('.dropdown-trigger');

    expect(dropdownTrigger).toBeInTheDocument();

    fireEvent.click(dropdownTrigger!);

    // Menu items should appear - check for dropdown menu specifically
    await waitFor(() => {
      const dropdownMenu = firstCard.querySelector('.dropdown-menu');
      expect(dropdownMenu).toBeInTheDocument();
      expect(within(dropdownMenu as HTMLElement).getByText('Open')).toBeInTheDocument();
      expect(within(dropdownMenu as HTMLElement).getByText('Rename')).toBeInTheDocument();
      expect(within(dropdownMenu as HTMLElement).getByText('Delete')).toBeInTheDocument();
      expect(within(dropdownMenu as HTMLElement).getByText('Export')).toBeInTheDocument();
    });
  });

  test('closes dropdown when clicking outside', async () => {
    mockedProjectsService.getProjects.mockResolvedValueOnce(mockProjects);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    // Open dropdown
    const projectCards = document.querySelectorAll('.project-card');
    const firstCard = projectCards[0];
    const dropdownTrigger = firstCard.querySelector('.dropdown-trigger');
    fireEvent.click(dropdownTrigger!);

    await waitFor(() => {
      expect(screen.getByText('Rename')).toBeInTheDocument();
    });

    // Click outside (on dashboard header)
    const header = document.querySelector('.dashboard-header');
    fireEvent.mouseDown(header!);

    await waitFor(() => {
      expect(screen.queryByText('Rename')).not.toBeInTheDocument();
    });
  });
});

describe('Project Actions Integration - Delete Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('shows confirmation dialog when Delete is clicked', async () => {
    mockedProjectsService.getProjects.mockResolvedValueOnce(mockProjects);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    // Open dropdown
    const projectCards = document.querySelectorAll('.project-card');
    const dropdownTrigger = projectCards[0].querySelector('.dropdown-trigger');
    fireEvent.click(dropdownTrigger!);

    // Click Delete
    await waitFor(() => {
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Delete'));

    // Confirmation dialog should appear
    await waitFor(() => {
      expect(screen.getByText('Delete Project')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to delete "Test Project 1"/)).toBeInTheDocument();
    });
  });

  test('cancels delete when Cancel button is clicked', async () => {
    mockedProjectsService.getProjects.mockResolvedValueOnce(mockProjects);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    // Open dropdown and click Delete
    const projectCards = document.querySelectorAll('.project-card');
    const dropdownTrigger = projectCards[0].querySelector('.dropdown-trigger');
    fireEvent.click(dropdownTrigger!);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Delete'));
    });

    // Wait for confirmation dialog
    await waitFor(() => {
      expect(screen.getByText('Delete Project')).toBeInTheDocument();
    });

    // Click Cancel
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    // Dialog should close and project should still be there
    await waitFor(() => {
      expect(screen.queryByText('Delete Project')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Test Project 1')).toBeInTheDocument();
  });

  test('deletes project and shows success toast when confirmed', async () => {
    mockedProjectsService.getProjects.mockResolvedValueOnce(mockProjects);
    mockedProjectsService.deleteProject.mockResolvedValueOnce(undefined);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    // Open dropdown and click Delete
    const projectCards = document.querySelectorAll('.project-card');
    const dropdownTrigger = projectCards[0].querySelector('.dropdown-trigger');
    fireEvent.click(dropdownTrigger!);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Delete'));
    });

    // Wait for confirmation dialog and confirm
    await waitFor(() => {
      expect(screen.getByText('Delete Project')).toBeInTheDocument();
    });

    // Find and click the Delete (confirm) button in the dialog
    const buttons = screen.getAllByRole('button');
    const confirmButton = buttons.find(btn => btn.textContent === 'Delete' && btn.classList.contains('confirm-dialog-btn-confirm'));
    fireEvent.click(confirmButton!);

    // Project should be removed from UI immediately (optimistic update)
    await waitFor(() => {
      expect(screen.queryByText('Test Project 1')).not.toBeInTheDocument();
    });

    // Success toast should appear
    await waitFor(() => {
      expect(screen.getByText('Project deleted successfully')).toBeInTheDocument();
    });

    // API should have been called
    expect(mockedProjectsService.deleteProject).toHaveBeenCalledWith(1);
  });

  test('shows error toast and reverts when delete fails', async () => {
    mockedProjectsService.getProjects.mockResolvedValueOnce(mockProjects);
    mockedProjectsService.deleteProject.mockRejectedValueOnce(new Error('Failed to delete project'));

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    // Open dropdown and click Delete
    const projectCards = document.querySelectorAll('.project-card');
    const dropdownTrigger = projectCards[0].querySelector('.dropdown-trigger');
    fireEvent.click(dropdownTrigger!);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Delete'));
    });

    // Confirm delete
    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      const confirmButton = buttons.find(btn => btn.textContent === 'Delete' && btn.classList.contains('confirm-dialog-btn-confirm'));
      fireEvent.click(confirmButton!);
    });

    // Error toast should appear
    await waitFor(() => {
      expect(screen.getByText('Failed to delete project')).toBeInTheDocument();
    });

    // Project should be back in the list (rollback)
    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });
  });
});

describe('Project Actions Integration - Rename Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('shows rename modal when Rename is clicked', async () => {
    mockedProjectsService.getProjects.mockResolvedValueOnce(mockProjects);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    // Open dropdown
    const projectCards = document.querySelectorAll('.project-card');
    const dropdownTrigger = projectCards[0].querySelector('.dropdown-trigger');
    fireEvent.click(dropdownTrigger!);

    // Click Rename
    await waitFor(() => {
      expect(screen.getByText('Rename')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Rename'));

    // Rename modal should appear
    await waitFor(() => {
      expect(screen.getByText('Rename Project')).toBeInTheDocument();
      const input = screen.getByLabelText('Project Name') as HTMLInputElement;
      expect(input.value).toBe('Test Project 1');
    });
  });

  test('cancels rename when Cancel button is clicked', async () => {
    mockedProjectsService.getProjects.mockResolvedValueOnce(mockProjects);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    // Open dropdown and click Rename
    const projectCards = document.querySelectorAll('.project-card');
    const dropdownTrigger = projectCards[0].querySelector('.dropdown-trigger');
    fireEvent.click(dropdownTrigger!);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Rename'));
    });

    // Wait for modal
    await waitFor(() => {
      expect(screen.getByText('Rename Project')).toBeInTheDocument();
    });

    // Click Cancel
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByText('Rename Project')).not.toBeInTheDocument();
    });
  });

  test('renames project and shows success toast when saved', async () => {
    mockedProjectsService.getProjects.mockResolvedValueOnce(mockProjects);
    mockedProjectsService.updateProject.mockResolvedValueOnce({
      ...mockProjects[0],
      name: 'Renamed Project',
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    // Open dropdown and click Rename
    const projectCards = document.querySelectorAll('.project-card');
    const dropdownTrigger = projectCards[0].querySelector('.dropdown-trigger');
    fireEvent.click(dropdownTrigger!);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Rename'));
    });

    // Change name
    await waitFor(() => {
      const input = screen.getByLabelText('Project Name') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'Renamed Project' } });
    });

    // Click Save
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    // Project name should update immediately (optimistic update)
    await waitFor(() => {
      expect(screen.getByText('Renamed Project')).toBeInTheDocument();
      expect(screen.queryByText('Test Project 1')).not.toBeInTheDocument();
    });

    // Success toast should appear
    await waitFor(() => {
      expect(screen.getByText('Project renamed successfully')).toBeInTheDocument();
    });

    // API should have been called
    expect(mockedProjectsService.updateProject).toHaveBeenCalledWith(1, { name: 'Renamed Project' });
  });

  test('validates empty name and shows error', async () => {
    mockedProjectsService.getProjects.mockResolvedValueOnce(mockProjects);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    // Open dropdown and click Rename
    const projectCards = document.querySelectorAll('.project-card');
    const dropdownTrigger = projectCards[0].querySelector('.dropdown-trigger');
    fireEvent.click(dropdownTrigger!);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Rename'));
    });

    // Clear name
    await waitFor(() => {
      const input = screen.getByLabelText('Project Name') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '' } });
    });

    // Try to save
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    // Error message should appear
    await waitFor(() => {
      expect(screen.getByText('Project name is required')).toBeInTheDocument();
    });

    // Modal should still be open
    expect(screen.getByText('Rename Project')).toBeInTheDocument();
  });

  test('validates name length and shows error', async () => {
    mockedProjectsService.getProjects.mockResolvedValueOnce(mockProjects);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    // Open dropdown and click Rename
    const projectCards = document.querySelectorAll('.project-card');
    const dropdownTrigger = projectCards[0].querySelector('.dropdown-trigger');
    fireEvent.click(dropdownTrigger!);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Rename'));
    });

    // Set name too long
    await waitFor(() => {
      const input = screen.getByLabelText('Project Name') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'a'.repeat(256) } });
    });

    // Try to save
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    // Error message should appear
    await waitFor(() => {
      expect(screen.getByText('Project name must be 255 characters or less')).toBeInTheDocument();
    });
  });

  test('shows error toast and reverts when rename fails', async () => {
    mockedProjectsService.getProjects.mockResolvedValueOnce(mockProjects);
    mockedProjectsService.updateProject.mockRejectedValueOnce(new Error('Failed to rename project'));

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    // Open dropdown and click Rename
    const projectCards = document.querySelectorAll('.project-card');
    const dropdownTrigger = projectCards[0].querySelector('.dropdown-trigger');
    fireEvent.click(dropdownTrigger!);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Rename'));
    });

    // Change name and save
    await waitFor(() => {
      const input = screen.getByLabelText('Project Name') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'New Name' } });
    });

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    // Error toast should appear
    await waitFor(() => {
      expect(screen.getByText('Failed to rename project')).toBeInTheDocument();
    });

    // Original name should be restored (rollback)
    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });
  });
});

describe('Project Actions Integration - Toast Notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('success toast auto-dismisses after 3 seconds', async () => {
    mockedProjectsService.getProjects.mockResolvedValueOnce(mockProjects);
    mockedProjectsService.deleteProject.mockResolvedValueOnce(undefined);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    // Trigger delete to show success toast
    const projectCards = document.querySelectorAll('.project-card');
    const dropdownTrigger = projectCards[0].querySelector('.dropdown-trigger');
    fireEvent.click(dropdownTrigger!);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Delete'));
    });

    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      const confirmButton = buttons.find(btn => btn.textContent === 'Delete' && btn.classList.contains('confirm-dialog-btn-confirm'));
      fireEvent.click(confirmButton!);
    });

    // Toast should appear
    await waitFor(() => {
      expect(screen.getByText('Project deleted successfully')).toBeInTheDocument();
    });

    // Advance time by 3 seconds
    jest.advanceTimersByTime(3000);

    // Toast should disappear
    await waitFor(() => {
      expect(screen.queryByText('Project deleted successfully')).not.toBeInTheDocument();
    });
  });

  test('toast can be manually dismissed via close button', async () => {
    mockedProjectsService.getProjects.mockResolvedValueOnce(mockProjects);
    mockedProjectsService.deleteProject.mockResolvedValueOnce(undefined);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    // Trigger delete to show success toast
    const projectCards = document.querySelectorAll('.project-card');
    const dropdownTrigger = projectCards[0].querySelector('.dropdown-trigger');
    fireEvent.click(dropdownTrigger!);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Delete'));
    });

    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      const confirmButton = buttons.find(btn => btn.textContent === 'Delete' && btn.classList.contains('confirm-dialog-btn-confirm'));
      fireEvent.click(confirmButton!);
    });

    // Toast should appear
    await waitFor(() => {
      expect(screen.getByText('Project deleted successfully')).toBeInTheDocument();
    });

    // Click close button
    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    // Toast should disappear immediately
    await waitFor(() => {
      expect(screen.queryByText('Project deleted successfully')).not.toBeInTheDocument();
    });
  });
});

describe('Project Actions Integration - Export Action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('shows info toast when Export is clicked', async () => {
    mockedProjectsService.getProjects.mockResolvedValueOnce(mockProjects);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    // Open dropdown and click Export
    const projectCards = document.querySelectorAll('.project-card');
    const dropdownTrigger = projectCards[0].querySelector('.dropdown-trigger');
    fireEvent.click(dropdownTrigger!);

    await waitFor(() => {
      expect(screen.getByText('Export')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Export'));

    // Info toast should appear
    await waitFor(() => {
      expect(screen.getByText('Export functionality coming soon!')).toBeInTheDocument();
    });
  });
});
