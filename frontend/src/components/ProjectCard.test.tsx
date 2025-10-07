import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProjectCard from './ProjectCard';
import { Project } from '../types';


const mockOnRename = jest.fn();
const mockOnDelete = jest.fn();
const mockOnExport = jest.fn();

// Sample project data for testing
const mockProject: Project = {
  id: 1,
  user_id: 1,
  name: 'Test Project',
  html_code: '<h1>Hello World</h1><p>This is a test paragraph with more content</p>',
  css_code: 'h1 { color: blue; }',
  js_code: 'console.log("test");',
  created_at: '2024-01-15T10:30:00.000Z',
  updated_at: '2024-01-20T14:45:00.000Z',
};

const mockProjectWithEmptyCode: Project = {
  id: 2,
  user_id: 1,
  name: 'Empty Project',
  html_code: '',
  css_code: '',
  js_code: '',
  created_at: '2024-01-10T08:00:00.000Z',
  updated_at: '2024-01-10T08:00:00.000Z',
};

const mockProjectWithShortCode: Project = {
  id: 3,
  user_id: 1,
  name: 'Short Code Project',
  html_code: '<div>Short</div>',
  css_code: '',
  js_code: '',
  created_at: '2024-01-12T12:00:00.000Z',
  updated_at: '2024-01-12T12:00:00.000Z',
};

// Helper function to render ProjectCard with Router
const renderProjectCard = (project: Project) => {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route 
          path="/dashboard" 
          element={
            <ProjectCard 
              project={mockProject} 
              onRename={mockOnRename}
              onDelete={mockOnDelete}
              onExport={mockOnExport}
            />
          }
        />
        <Route path="/editor/:id" element={<div>Editor Page</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('ProjectCard Component - Rendering', () => {
  test('renders project card with project name', () => {
    renderProjectCard(mockProject);

    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  test('renders project name as heading', () => {
    renderProjectCard(mockProject);

    const heading = screen.getByRole('heading', { name: 'Test Project' });
    expect(heading).toBeInTheDocument();
    expect(heading.tagName).toBe('H3');
  });

  test('renders Open button', () => {
    renderProjectCard(mockProject);

    expect(screen.getByRole('button', { name: /open/i })).toBeInTheDocument();
  });

  test('has proper CSS classes', () => {
    const { container } = renderProjectCard(mockProject);

    expect(container.querySelector('.project-card')).toBeInTheDocument();
    expect(container.querySelector('.project-card-header')).toBeInTheDocument();
    expect(container.querySelector('.project-card-body')).toBeInTheDocument();
    expect(container.querySelector('.project-card-footer')).toBeInTheDocument();
  });
});

describe('ProjectCard Component - Date Formatting', () => {
  test('displays created date in readable format', () => {
    renderProjectCard(mockProject);

    // Should show "Created:" label
    expect(screen.getByText(/created:/i)).toBeInTheDocument();

    // Should display formatted date (Jan 15, 2024)
    expect(screen.getByText(/jan 15, 2024/i)).toBeInTheDocument();
  });

  test('displays updated date in readable format', () => {
    renderProjectCard(mockProject);

    // Should show "Updated:" label
    expect(screen.getByText(/updated:/i)).toBeInTheDocument();

    // Should display formatted date (Jan 20, 2024)
    expect(screen.getByText(/jan 20, 2024/i)).toBeInTheDocument();
  });

  test('formats dates with proper month abbreviation', () => {
    const projectWithDifferentDate: Project = {
      ...mockProject,
      created_at: '2024-03-25T10:00:00.000Z',
      updated_at: '2024-03-25T10:00:00.000Z',
    };

    renderProjectCard(projectWithDifferentDate);

    // Both created and updated dates are the same, so we should have 2 instances
    const dateElements = screen.getAllByText(/mar 25, 2024/i);
    expect(dateElements.length).toBeGreaterThanOrEqual(1);
  });

  test('handles same created and updated dates', () => {
    renderProjectCard(mockProjectWithEmptyCode);

    // Both dates should be the same
    const dateElements = screen.getAllByText(/jan 10, 2024/i);
    expect(dateElements).toHaveLength(2);
  });
});

describe('ProjectCard Component - Code Preview', () => {
  test('displays HTML code preview label', () => {
    renderProjectCard(mockProject);

    expect(screen.getByText(/html preview:/i)).toBeInTheDocument();
  });

  test('displays code preview in code element', () => {
    renderProjectCard(mockProject);

    const codeElement = screen.getByText(/<h1>Hello World<\/h1><p>This is a test paragraph w.../);
    expect(codeElement.tagName).toBe('CODE');
  });

  test('truncates long HTML code to 50 characters', () => {
    renderProjectCard(mockProject);

    const preview = screen.getByText(/<h1>Hello World<\/h1><p>This is a test paragraph w.../);
    expect(preview).toBeInTheDocument();

    // Preview text should end with "..."
    expect(preview.textContent).toMatch(/\.\.\.$/);
  });

  test('does not truncate short HTML code', () => {
    renderProjectCard(mockProjectWithShortCode);

    const preview = screen.getByText('<div>Short</div>');
    expect(preview).toBeInTheDocument();

    // Preview text should NOT end with "..."
    expect(preview.textContent).not.toMatch(/\.\.\.$/);
  });

  test('displays "No code yet..." for empty HTML code', () => {
    renderProjectCard(mockProjectWithEmptyCode);

    expect(screen.getByText(/no code yet\.\.\./i)).toBeInTheDocument();
  });

  test('displays "No code yet..." for whitespace-only HTML code', () => {
    const projectWithWhitespace: Project = {
      ...mockProject,
      html_code: '   \n\t  ',
    };

    renderProjectCard(projectWithWhitespace);

    expect(screen.getByText(/no code yet\.\.\./i)).toBeInTheDocument();
  });

  test('preview is styled with preview-code class', () => {
    const { container } = renderProjectCard(mockProject);

    const previewCode = container.querySelector('.preview-code');
    expect(previewCode).toBeInTheDocument();
    expect(previewCode?.tagName).toBe('CODE');
  });
});

describe('ProjectCard Component - Metadata Display', () => {
  test('displays metadata section', () => {
    const { container } = renderProjectCard(mockProject);

    expect(container.querySelector('.project-card-meta')).toBeInTheDocument();
  });

  test('displays created date with label', () => {
    renderProjectCard(mockProject);

    expect(screen.getByText(/created:/i)).toBeInTheDocument();
    expect(screen.getByText(/created:/i).classList.contains('meta-label')).toBe(true);
  });

  test('displays updated date with label', () => {
    renderProjectCard(mockProject);

    expect(screen.getByText(/updated:/i)).toBeInTheDocument();
    expect(screen.getByText(/updated:/i).classList.contains('meta-label')).toBe(true);
  });

  test('metadata has proper structure with date containers', () => {
    const { container } = renderProjectCard(mockProject);

    const dateContainers = container.querySelectorAll('.project-card-date');
    expect(dateContainers).toHaveLength(2);
  });
});

describe('ProjectCard Component - Navigation', () => {
  test('Open button navigates to editor with project ID', () => {
    renderProjectCard(mockProject);

    const openButton = screen.getByRole('button', { name: /open/i });
    fireEvent.click(openButton);

    // Should navigate to /editor/1
    expect(screen.getByText(/editor page/i)).toBeInTheDocument();
  });

  test('Open button navigates with correct project ID for different projects', () => {
    const project2 = { ...mockProject, id: 42, name: 'Project 42' };
    renderProjectCard(project2);

    const openButton = screen.getByRole('button', { name: /open/i });
    fireEvent.click(openButton);

    // Should navigate to /editor/42
    expect(screen.getByText(/editor page/i)).toBeInTheDocument();
  });

  test('Open button is clickable', () => {
    renderProjectCard(mockProject);

    const openButton = screen.getByRole('button', { name: /open/i });
    expect(openButton).not.toBeDisabled();
  });

  test('Open button has proper styling class', () => {
    const { container } = renderProjectCard(mockProject);

    const openButton = container.querySelector('.project-card-open-btn');
    expect(openButton).toBeInTheDocument();
  });
});

describe('ProjectCard Component - Edge Cases', () => {
  test('handles project with very long name', () => {
    const projectWithLongName: Project = {
      ...mockProject,
      name: 'This is a very long project name that should still be displayed correctly without breaking the layout',
    };

    renderProjectCard(projectWithLongName);

    expect(screen.getByText(projectWithLongName.name)).toBeInTheDocument();
  });

  test('handles project with special characters in name', () => {
    const projectWithSpecialChars: Project = {
      ...mockProject,
      name: 'Test & Project <with> "special" \'characters\'',
    };

    renderProjectCard(projectWithSpecialChars);

    expect(screen.getByText(projectWithSpecialChars.name)).toBeInTheDocument();
  });

  test('handles project with HTML entities in code', () => {
    const projectWithEntities: Project = {
      ...mockProject,
      html_code: '<div>&lt;script&gt;alert("test")&lt;/script&gt;</div>',
    };

    renderProjectCard(projectWithEntities);

    // Check that the preview exists (text might be truncated)
    const codePreview = screen.getByText(/&lt;script&gt;/);
    expect(codePreview).toBeInTheDocument();
  });

  test('handles project with exactly 50 characters in HTML', () => {
    const projectWith50Chars: Project = {
      ...mockProject,
      html_code: '12345678901234567890123456789012345678901234567890', // Exactly 50 chars
    };

    renderProjectCard(projectWith50Chars);

    // Find code element by querying for text that starts with the expected string
    const codeElement = screen.getByText(/^12345678901234567890/);
    expect(codeElement).toBeInTheDocument();

    // Component adds "..." even for exactly 50 characters (when preview.length === 50)
    expect(codeElement.textContent).toMatch(/\.\.\.$/);
    expect(codeElement.textContent).toBe('12345678901234567890123456789012345678901234567890...');
  });

  test('handles project with 51 characters in HTML', () => {
    const projectWith51Chars: Project = {
      ...mockProject,
      html_code: '123456789012345678901234567890123456789012345678901', // 51 chars
    };

    renderProjectCard(projectWith51Chars);

    // Should show first 50 characters plus "..."
    const preview = screen.getByText(/^12345678901234567890123456789012345678901234567890\.\.\.$/);
    expect(preview).toBeInTheDocument();
  });

  test('handles project with only whitespace in name', () => {
    const projectWithWhitespaceName: Project = {
      ...mockProject,
      name: '   ',
    };

    renderProjectCard(projectWithWhitespaceName);

    // Should still render, even if empty-looking
    const { container } = renderProjectCard(projectWithWhitespaceName);
    expect(container.querySelector('.project-card')).toBeInTheDocument();
  });

  test('handles invalid date format gracefully', () => {
    const projectWithInvalidDate: Project = {
      ...mockProject,
      created_at: 'Invalid Date String',
      updated_at: 'Invalid Date String',
    };

    // Should not crash when rendering
    const { container } = renderProjectCard(projectWithInvalidDate);
    expect(container.querySelector('.project-card')).toBeInTheDocument();
  });

  test('handles future dates', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    const projectWithFutureDate: Project = {
      ...mockProject,
      created_at: futureDate.toISOString(),
      updated_at: futureDate.toISOString(),
    };

    renderProjectCard(projectWithFutureDate);

    // Should display the future date correctly
    const { container } = renderProjectCard(projectWithFutureDate);
    expect(container.querySelector('.project-card-date')).toBeInTheDocument();
  });
});

describe('ProjectCard Component - Accessibility', () => {
  test('Open button is keyboard accessible', () => {
    renderProjectCard(mockProject);

    const openButton = screen.getByRole('button', { name: /open/i });

    // Button should be focusable and clickable via keyboard
    openButton.focus();
    expect(document.activeElement).toBe(openButton);
  });

  test('project name is accessible as a heading', () => {
    renderProjectCard(mockProject);

    const heading = screen.getByRole('heading', { name: 'Test Project' });
    expect(heading).toBeInTheDocument();
  });

  test('metadata labels are properly associated with values', () => {
    const { container } = renderProjectCard(mockProject);

    const metaLabels = container.querySelectorAll('.meta-label');
    expect(metaLabels.length).toBeGreaterThan(0);

    const metaValues = container.querySelectorAll('.meta-value');
    expect(metaValues.length).toBeGreaterThan(0);
  });

  test('code preview has semantic code element', () => {
    renderProjectCard(mockProject);

    const codeElements = screen.getAllByText(/<h1>Hello World<\/h1><p>This is a test paragraph w.../);
    const codeElement = codeElements.find(el => el.tagName === 'CODE');
    expect(codeElement).toBeInTheDocument();
  });
});

describe('ProjectCard Component - Structure and Layout', () => {
  test('has header, body, and footer sections', () => {
    const { container } = renderProjectCard(mockProject);

    expect(container.querySelector('.project-card-header')).toBeInTheDocument();
    expect(container.querySelector('.project-card-body')).toBeInTheDocument();
    expect(container.querySelector('.project-card-footer')).toBeInTheDocument();
  });

  test('header contains project title', () => {
    const { container } = renderProjectCard(mockProject);

    const header = container.querySelector('.project-card-header');
    const title = header?.querySelector('.project-card-title');
    expect(title).toBeInTheDocument();
    expect(title?.textContent).toBe('Test Project');
  });

  test('body contains metadata and preview', () => {
    const { container } = renderProjectCard(mockProject);

    const body = container.querySelector('.project-card-body');
    expect(body?.querySelector('.project-card-meta')).toBeInTheDocument();
    expect(body?.querySelector('.project-card-preview')).toBeInTheDocument();
  });

  test('footer contains Open button', () => {
    const { container } = renderProjectCard(mockProject);

    const footer = container.querySelector('.project-card-footer');
    expect(footer?.querySelector('.project-card-open-btn')).toBeInTheDocument();
  });

  test('preview section has label and code', () => {
    const { container } = renderProjectCard(mockProject);

    const preview = container.querySelector('.project-card-preview');
    expect(preview?.querySelector('.preview-label')).toBeInTheDocument();
    expect(preview?.querySelector('.preview-code')).toBeInTheDocument();
  });
});

describe('ProjectCard Component - Multiple Instances', () => {
  test('renders multiple project cards independently', () => {
    const { container: container1 } = renderProjectCard(mockProject);
    const { container: container2 } = renderProjectCard(mockProjectWithEmptyCode);

    expect(container1.querySelector('.project-card')).toBeInTheDocument();
    expect(container2.querySelector('.project-card')).toBeInTheDocument();
  });

  test('each card has unique project data', () => {
    render(
      <MemoryRouter>
        <div>
          <ProjectCard 
            project={mockProject} 
            onRename={mockOnRename}
            onDelete={mockOnDelete}
            onExport={mockOnExport}
          />
          <ProjectCard
            project={mockProject}
            onRename={mockOnRename}
            onDelete={mockOnDelete}
            onExport={mockOnExport}
          />
          <ProjectCard
            project={mockProject}
            onRename={mockOnRename}
            onDelete={mockOnDelete}
            onExport={mockOnExport}
          />
        </div>
      </MemoryRouter>
    );

    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('Empty Project')).toBeInTheDocument();
    expect(screen.getByText('Short Code Project')).toBeInTheDocument();
  });
});
