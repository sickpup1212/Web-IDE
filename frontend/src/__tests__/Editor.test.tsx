import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';
import Editor from '../pages/Editor';
import * as projectsService from '../services/projects';
import { Project } from '../types';

// Mock the projects service
jest.mock('../services/projects');

// Mock the CodeEditor component
jest.mock('../components/CodeEditor', () => {
  return function MockCodeEditor({
    value,
    onChange,
    language
  }: {
    value: string;
    onChange: (value: string) => void;
    language: string;
  }) {
    return (
      <textarea
        data-testid={`code-editor-${language}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  };
});

const mockProject: Project = {
  id: 1,
  user_id: 1,
  name: 'Test Project',
  html_code: '<h1>Hello</h1>',
  css_code: 'h1 { color: red; }',
  js_code: 'console.log("test");',
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: '2025-01-01T00:00:00.000Z'
};

describe('Editor Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('New Project (no ID)', () => {
    it('should render editor with empty code for new project', () => {
      render(
        <MemoryRouter initialEntries={['/editor']}>
          <Routes>
            <Route path="/editor" element={<Editor />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Untitled Project')).toBeInTheDocument();
      expect(screen.getByText('HTML')).toBeInTheDocument();
      expect(screen.getByText('CSS')).toBeInTheDocument();
      expect(screen.getByText('JavaScript')).toBeInTheDocument();
    });

    it('should have Save button disabled initially', () => {
      render(
        <MemoryRouter initialEntries={['/editor']}>
          <Routes>
            <Route path="/editor" element={<Editor />} />
          </Routes>
        </MemoryRouter>
      );

      const saveButton = screen.getByRole('button', { name: /save$/i });
      expect(saveButton).toBeDisabled();
    });

    it('should enable Save button when code is changed', async () => {
      render(
        <MemoryRouter initialEntries={['/editor']}>
          <Routes>
            <Route path="/editor" element={<Editor />} />
          </Routes>
        </MemoryRouter>
      );

      const htmlEditor = screen.getByTestId('code-editor-html');
      fireEvent.change(htmlEditor, { target: { value: '<h1>Test</h1>' } });

      const saveButton = screen.getByRole('button', { name: /save$/i });
      expect(saveButton).not.toBeDisabled();
    });

    it('should show dirty indicator (*) when code is changed', async () => {
      render(
        <MemoryRouter initialEntries={['/editor']}>
          <Routes>
            <Route path="/editor" element={<Editor />} />
          </Routes>
        </MemoryRouter>
      );

      const htmlEditor = screen.getByTestId('code-editor-html');
      fireEvent.change(htmlEditor, { target: { value: '<h1>Test</h1>' } });

      expect(screen.getByText(/\*/)).toBeInTheDocument();
    });
  });

  describe('Existing Project (with ID)', () => {
    it('should load project data on mount', async () => {
      (projectsService.getProject as jest.Mock).mockResolvedValue(mockProject);

      render(
        <MemoryRouter initialEntries={['/editor/1']}>
          <Routes>
            <Route path="/editor/:id" element={<Editor />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(projectsService.getProject).toHaveBeenCalledWith(1);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });
    });

    it('should populate editors with project code', async () => {
      (projectsService.getProject as jest.Mock).mockResolvedValue(mockProject);

      render(
        <MemoryRouter initialEntries={['/editor/1']}>
          <Routes>
            <Route path="/editor/:id" element={<Editor />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        const htmlEditor = screen.getByTestId('code-editor-html');
        expect(htmlEditor).toHaveValue('<h1>Hello</h1>');
      });
    });

    it('should show loading state while fetching project', () => {
      (projectsService.getProject as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(
        <MemoryRouter initialEntries={['/editor/1']}>
          <Routes>
            <Route path="/editor/:id" element={<Editor />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Loading project...')).toBeInTheDocument();
    });

    it('should show error message if project fails to load', async () => {
      (projectsService.getProject as jest.Mock).mockRejectedValue(
        new Error('Project not found')
      );

      render(
        <MemoryRouter initialEntries={['/editor/1']}>
          <Routes>
            <Route path="/editor/:id" element={<Editor />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Error Loading Project')).toBeInTheDocument();
        expect(screen.getByText('Project not found')).toBeInTheDocument();
      });
    });

    it('should show error for invalid project ID', async () => {
      render(
        <MemoryRouter initialEntries={['/editor/invalid']}>
          <Routes>
            <Route path="/editor/:id" element={<Editor />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Error Loading Project')).toBeInTheDocument();
        expect(screen.getByText('Invalid project ID')).toBeInTheDocument();
      });
    });
  });

  describe('Tab Navigation', () => {
    it('should show HTML tab as active by default', () => {
      render(
        <MemoryRouter initialEntries={['/editor']}>
          <Routes>
            <Route path="/editor" element={<Editor />} />
          </Routes>
        </MemoryRouter>
      );

      const htmlTab = screen.getByRole('button', { name: 'HTML' });
      expect(htmlTab).toHaveClass('editor__tab--active');
    });

    it('should switch to CSS tab when clicked', () => {
      render(
        <MemoryRouter initialEntries={['/editor']}>
          <Routes>
            <Route path="/editor" element={<Editor />} />
          </Routes>
        </MemoryRouter>
      );

      const cssTab = screen.getByRole('button', { name: 'CSS' });
      fireEvent.click(cssTab);

      expect(cssTab).toHaveClass('editor__tab--active');
    });

    it('should switch to JavaScript tab when clicked', () => {
      render(
        <MemoryRouter initialEntries={['/editor']}>
          <Routes>
            <Route path="/editor" element={<Editor />} />
          </Routes>
        </MemoryRouter>
      );

      const jsTab = screen.getByRole('button', { name: 'JavaScript' });
      fireEvent.click(jsTab);

      expect(jsTab).toHaveClass('editor__tab--active');
    });
  });

  describe('Code Editing', () => {
    it('should update HTML code when typing', () => {
      render(
        <MemoryRouter initialEntries={['/editor']}>
          <Routes>
            <Route path="/editor" element={<Editor />} />
          </Routes>
        </MemoryRouter>
      );

      const htmlEditor = screen.getByTestId('code-editor-html');
      fireEvent.change(htmlEditor, { target: { value: '<div>New</div>' } });

      expect(htmlEditor).toHaveValue('<div>New</div>');
    });

    it('should update CSS code when typing', () => {
      render(
        <MemoryRouter initialEntries={['/editor']}>
          <Routes>
            <Route path="/editor" element={<Editor />} />
          </Routes>
        </MemoryRouter>
      );

      // Switch to CSS tab
      const cssTab = screen.getByRole('button', { name: 'CSS' });
      fireEvent.click(cssTab);

      const cssEditor = screen.getByTestId('code-editor-css');
      fireEvent.change(cssEditor, { target: { value: 'body { margin: 0; }' } });

      expect(cssEditor).toHaveValue('body { margin: 0; }');
    });

    it('should update JavaScript code when typing', () => {
      render(
        <MemoryRouter initialEntries={['/editor']}>
          <Routes>
            <Route path="/editor" element={<Editor />} />
          </Routes>
        </MemoryRouter>
      );

      // Switch to JavaScript tab
      const jsTab = screen.getByRole('button', { name: 'JavaScript' });
      fireEvent.click(jsTab);

      const jsEditor = screen.getByTestId('code-editor-javascript');
      fireEvent.change(jsEditor, { target: { value: 'alert("test");' } });

      expect(jsEditor).toHaveValue('alert("test");');
    });
  });

  describe('Dirty Flag Tracking', () => {
    it('should set dirty flag when HTML is changed', () => {
      render(
        <MemoryRouter initialEntries={['/editor']}>
          <Routes>
            <Route path="/editor" element={<Editor />} />
          </Routes>
        </MemoryRouter>
      );

      const htmlEditor = screen.getByTestId('code-editor-html');
      fireEvent.change(htmlEditor, { target: { value: '<h1>Test</h1>' } });

      expect(screen.getByText(/\*/)).toBeInTheDocument();
    });

    it('should set dirty flag when CSS is changed', () => {
      render(
        <MemoryRouter initialEntries={['/editor']}>
          <Routes>
            <Route path="/editor" element={<Editor />} />
          </Routes>
        </MemoryRouter>
      );

      const cssTab = screen.getByRole('button', { name: 'CSS' });
      fireEvent.click(cssTab);

      const cssEditor = screen.getByTestId('code-editor-css');
      fireEvent.change(cssEditor, { target: { value: 'body {}' } });

      expect(screen.getByText(/\*/)).toBeInTheDocument();
    });

    it('should set dirty flag when JavaScript is changed', () => {
      render(
        <MemoryRouter initialEntries={['/editor']}>
          <Routes>
            <Route path="/editor" element={<Editor />} />
          </Routes>
        </MemoryRouter>
      );

      const jsTab = screen.getByRole('button', { name: 'JavaScript' });
      fireEvent.click(jsTab);

      const jsEditor = screen.getByTestId('code-editor-javascript');
      fireEvent.change(jsEditor, { target: { value: 'console.log()' } });

      expect(screen.getByText(/\*/)).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should have Back to Dashboard button', () => {
      render(
        <MemoryRouter initialEntries={['/editor']}>
          <Routes>
            <Route path="/editor" element={<Editor />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByRole('button', { name: 'Back to Dashboard' })).toBeInTheDocument();
    });

    it('should show confirmation when leaving with unsaved changes', () => {
      // Mock window.confirm
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

      render(
        <MemoryRouter initialEntries={['/editor']}>
          <Routes>
            <Route path="/editor" element={<Editor />} />
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Routes>
        </MemoryRouter>
      );

      // Make changes to mark as dirty
      const htmlEditor = screen.getByTestId('code-editor-html');
      fireEvent.change(htmlEditor, { target: { value: '<h1>Test</h1>' } });

      // Try to navigate away
      const backButton = screen.getByRole('button', { name: 'Back to Dashboard' });
      fireEvent.click(backButton);

      expect(confirmSpy).toHaveBeenCalledWith(
        'You have unsaved changes. Are you sure you want to leave?'
      );

      confirmSpy.mockRestore();
    });
  });

  describe('Save Functionality', () => {
    it('should have Save button', () => {
      render(
        <MemoryRouter initialEntries={['/editor']}>
          <Routes>
            <Route path="/editor" element={<Editor />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByRole('button', { name: /save$/i })).toBeInTheDocument();
    });

    it('should have Save As button', () => {
      render(
        <MemoryRouter initialEntries={['/editor']}>
          <Routes>
            <Route path="/editor" element={<Editor />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByRole('button', { name: 'Save As' })).toBeInTheDocument();
    });

    it('should clear dirty flag when Save is clicked', () => {
      render(
        <MemoryRouter initialEntries={['/editor']}>
          <Routes>
            <Route path="/editor" element={<Editor />} />
          </Routes>
        </MemoryRouter>
      );

      // Make changes
      const htmlEditor = screen.getByTestId('code-editor-html');
      fireEvent.change(htmlEditor, { target: { value: '<h1>Test</h1>' } });

      expect(screen.getByText(/\*/)).toBeInTheDocument();

      // Click Save
      const saveButton = screen.getByRole('button', { name: /save$/i });
      fireEvent.click(saveButton);

      // Dirty indicator should be gone
      expect(screen.queryByText(/\*/)).not.toBeInTheDocument();
    });
  });
});
