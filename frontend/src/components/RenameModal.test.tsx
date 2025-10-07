import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RenameModal from './RenameModal';

describe('RenameModal Component - Basic Rendering', () => {
  test('does not render when isOpen is false', () => {
    render(
      <RenameModal
        isOpen={false}
        currentName="Test Project"
        onRename={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.queryByText('Rename Project')).not.toBeInTheDocument();
  });

  test('renders when isOpen is true', () => {
    render(
      <RenameModal
        isOpen={true}
        currentName="Test Project"
        onRename={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.getByText('Rename Project')).toBeInTheDocument();
  });

  test('renders title', () => {
    render(
      <RenameModal
        isOpen={true}
        currentName="Test Project"
        onRename={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.getByText('Rename Project')).toBeInTheDocument();
  });

  test('renders input field with current name', () => {
    render(
      <RenameModal
        isOpen={true}
        currentName="My Project"
        onRename={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    const input = screen.getByLabelText('Project Name') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('My Project');
  });

  test('renders Cancel button', () => {
    render(
      <RenameModal
        isOpen={true}
        currentName="Test Project"
        onRename={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  test('renders Save button', () => {
    render(
      <RenameModal
        isOpen={true}
        currentName="Test Project"
        onRename={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.getByText('Save')).toBeInTheDocument();
  });
});

describe('RenameModal Component - Input Interaction', () => {
  test('allows typing in input field', () => {
    render(
      <RenameModal
        isOpen={true}
        currentName="Old Name"
        onRename={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    const input = screen.getByLabelText('Project Name') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'New Name' } });

    expect(input.value).toBe('New Name');
  });

  test('input field has placeholder text', () => {
    render(
      <RenameModal
        isOpen={true}
        currentName=""
        onRename={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    const input = screen.getByPlaceholderText('Enter project name');
    expect(input).toBeInTheDocument();
  });

  test('input field has maxLength of 255', () => {
    render(
      <RenameModal
        isOpen={true}
        currentName="Test"
        onRename={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    const input = screen.getByLabelText('Project Name') as HTMLInputElement;
    expect(input).toHaveAttribute('maxLength', '255');
  });

  test('input receives focus when modal opens', async () => {
    render(
      <RenameModal
        isOpen={true}
        currentName="Test Project"
        onRename={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    const input = screen.getByLabelText('Project Name') as HTMLInputElement;

    await waitFor(() => {
      expect(document.activeElement).toBe(input);
    }, { timeout: 200 });
  });

  test('input text is selected when modal opens', async () => {
    render(
      <RenameModal
        isOpen={true}
        currentName="Test Project"
        onRename={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    const input = screen.getByLabelText('Project Name') as HTMLInputElement;

    // Wait for focus and selection
    await waitFor(() => {
      expect(input.selectionStart).toBe(0);
      expect(input.selectionEnd).toBe('Test Project'.length);
    }, { timeout: 200 });
  });
});

describe('RenameModal Component - Validation', () => {
  test('shows error when name is empty', () => {
    render(
      <RenameModal
        isOpen={true}
        currentName="Test"
        onRename={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    const input = screen.getByLabelText('Project Name');
    fireEvent.change(input, { target: { value: '' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    expect(screen.getByText('Project name is required')).toBeInTheDocument();
  });

  test('shows error when name is only whitespace', () => {
    render(
      <RenameModal
        isOpen={true}
        currentName="Test"
        onRename={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    const input = screen.getByLabelText('Project Name');
    fireEvent.change(input, { target: { value: '   ' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    expect(screen.getByText('Project name is required')).toBeInTheDocument();
  });

  test('shows error when name exceeds 255 characters', () => {
    const longName = 'a'.repeat(256);

    render(
      <RenameModal
        isOpen={true}
        currentName="Test"
        onRename={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    const input = screen.getByLabelText('Project Name');
    fireEvent.change(input, { target: { value: longName } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    expect(screen.getByText('Project name must be 255 characters or less')).toBeInTheDocument();
  });

  test('does not show error for valid name', () => {
    render(
      <RenameModal
        isOpen={true}
        currentName="Test"
        onRename={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    const input = screen.getByLabelText('Project Name');
    fireEvent.change(input, { target: { value: 'Valid Name' } });

    expect(screen.queryByText('Project name is required')).not.toBeInTheDocument();
    expect(screen.queryByText('Project name must be 255 characters or less')).not.toBeInTheDocument();
  });

  test('accepts name with exactly 255 characters', () => {
    const maxLengthName = 'a'.repeat(255);
    const mockOnRename = jest.fn();

    render(
      <RenameModal
        isOpen={true}
        currentName="Test"
        onRename={mockOnRename}
        onCancel={jest.fn()}
      />
    );

    const input = screen.getByLabelText('Project Name');
    fireEvent.change(input, { target: { value: maxLengthName } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    expect(mockOnRename).toHaveBeenCalledWith(maxLengthName);
  });

  test('clears error when user starts typing after validation error', () => {
    render(
      <RenameModal
        isOpen={true}
        currentName="Test"
        onRename={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    const input = screen.getByLabelText('Project Name');

    // Trigger validation error
    fireEvent.change(input, { target: { value: '' } });
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    expect(screen.getByText('Project name is required')).toBeInTheDocument();

    // Start typing - error should clear
    fireEvent.change(input, { target: { value: 'N' } });

    expect(screen.queryByText('Project name is required')).not.toBeInTheDocument();
  });

  test('applies error class to input when validation fails', () => {
    render(
      <RenameModal
        isOpen={true}
        currentName="Test"
        onRename={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    const input = screen.getByLabelText('Project Name');
    fireEvent.change(input, { target: { value: '' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    expect(input).toHaveClass('rename-modal-input-error');
  });
});

describe('RenameModal Component - Form Submission', () => {
  test('calls onRename with new name when Save is clicked', () => {
    const mockOnRename = jest.fn();

    render(
      <RenameModal
        isOpen={true}
        currentName="Old Name"
        onRename={mockOnRename}
        onCancel={jest.fn()}
      />
    );

    const input = screen.getByLabelText('Project Name');
    fireEvent.change(input, { target: { value: 'New Name' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    expect(mockOnRename).toHaveBeenCalledWith('New Name');
  });

  test('trims whitespace from name before calling onRename', () => {
    const mockOnRename = jest.fn();

    render(
      <RenameModal
        isOpen={true}
        currentName="Old Name"
        onRename={mockOnRename}
        onCancel={jest.fn()}
      />
    );

    const input = screen.getByLabelText('Project Name');
    fireEvent.change(input, { target: { value: '  New Name  ' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    expect(mockOnRename).toHaveBeenCalledWith('New Name');
  });

  test('does not call onRename if validation fails', () => {
    const mockOnRename = jest.fn();

    render(
      <RenameModal
        isOpen={true}
        currentName="Old Name"
        onRename={mockOnRename}
        onCancel={jest.fn()}
      />
    );

    const input = screen.getByLabelText('Project Name');
    fireEvent.change(input, { target: { value: '' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    expect(mockOnRename).not.toHaveBeenCalled();
  });

  test('calls onCancel if name has not changed', () => {
    const mockOnRename = jest.fn();
    const mockOnCancel = jest.fn();

    render(
      <RenameModal
        isOpen={true}
        currentName="Same Name"
        onRename={mockOnRename}
        onCancel={mockOnCancel}
      />
    );

    // Keep the same name
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    expect(mockOnRename).not.toHaveBeenCalled();
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  test('submits form when Enter key is pressed', () => {
    const mockOnRename = jest.fn();

    render(
      <RenameModal
        isOpen={true}
        currentName="Old Name"
        onRename={mockOnRename}
        onCancel={jest.fn()}
      />
    );

    const input = screen.getByLabelText('Project Name');
    fireEvent.change(input, { target: { value: 'New Name' } });
    fireEvent.submit(input.closest('form')!);

    expect(mockOnRename).toHaveBeenCalledWith('New Name');
  });
});

describe('RenameModal Component - Cancel Behavior', () => {
  test('calls onCancel when Cancel button is clicked', () => {
    const mockOnCancel = jest.fn();

    render(
      <RenameModal
        isOpen={true}
        currentName="Test Project"
        onRename={jest.fn()}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  test('does not call onRename when Cancel is clicked', () => {
    const mockOnRename = jest.fn();

    render(
      <RenameModal
        isOpen={true}
        currentName="Test Project"
        onRename={mockOnRename}
        onCancel={jest.fn()}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnRename).not.toHaveBeenCalled();
  });

  test('calls onCancel when backdrop is clicked', () => {
    const mockOnCancel = jest.fn();

    const { container } = render(
      <RenameModal
        isOpen={true}
        currentName="Test Project"
        onRename={jest.fn()}
        onCancel={mockOnCancel}
      />
    );

    const backdrop = container.querySelector('.rename-modal-backdrop');
    fireEvent.click(backdrop!);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  test('does not call onCancel when clicking inside modal content', () => {
    const mockOnCancel = jest.fn();

    const { container } = render(
      <RenameModal
        isOpen={true}
        currentName="Test Project"
        onRename={jest.fn()}
        onCancel={mockOnCancel}
      />
    );

    const modal = container.querySelector('.rename-modal');
    fireEvent.click(modal!);

    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  test('calls onCancel when Escape key is pressed', () => {
    const mockOnCancel = jest.fn();

    render(
      <RenameModal
        isOpen={true}
        currentName="Test Project"
        onRename={jest.fn()}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });
});

describe('RenameModal Component - State Management', () => {
  test('resets to current name when modal reopens', () => {
    const { rerender } = render(
      <RenameModal
        isOpen={true}
        currentName="Original Name"
        onRename={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    const input = screen.getByLabelText('Project Name') as HTMLInputElement;

    // Change the input
    fireEvent.change(input, { target: { value: 'Modified Name' } });
    expect(input.value).toBe('Modified Name');

    // Close and reopen modal
    rerender(
      <RenameModal
        isOpen={false}
        currentName="Original Name"
        onRename={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    rerender(
      <RenameModal
        isOpen={true}
        currentName="Original Name"
        onRename={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    const newInput = screen.getByLabelText('Project Name') as HTMLInputElement;
    expect(newInput.value).toBe('Original Name');
  });

  test('clears errors when modal reopens', () => {
    const { rerender } = render(
      <RenameModal
        isOpen={true}
        currentName="Test"
        onRename={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    // Trigger validation error
    const input = screen.getByLabelText('Project Name');
    fireEvent.change(input, { target: { value: '' } });
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    expect(screen.getByText('Project name is required')).toBeInTheDocument();

    // Close and reopen modal
    rerender(
      <RenameModal
        isOpen={false}
        currentName="Test"
        onRename={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    rerender(
      <RenameModal
        isOpen={true}
        currentName="Test"
        onRename={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.queryByText('Project name is required')).not.toBeInTheDocument();
  });

  test('updates input when currentName prop changes', () => {
    const { rerender } = render(
      <RenameModal
        isOpen={true}
        currentName="First Name"
        onRename={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    let input = screen.getByLabelText('Project Name') as HTMLInputElement;
    expect(input.value).toBe('First Name');

    rerender(
      <RenameModal
        isOpen={true}
        currentName="Second Name"
        onRename={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    input = screen.getByLabelText('Project Name') as HTMLInputElement;
    expect(input.value).toBe('Second Name');
  });
});

describe('RenameModal Component - Body Scroll Management', () => {
  test('prevents body scroll when modal is open', () => {
    const originalOverflow = document.body.style.overflow;

    render(
      <RenameModal
        isOpen={true}
        currentName="Test"
        onRename={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(document.body.style.overflow).toBe('hidden');

    // Restore
    document.body.style.overflow = originalOverflow;
  });

  test('restores body scroll when modal closes', () => {
    const originalOverflow = document.body.style.overflow;

    const { rerender } = render(
      <RenameModal
        isOpen={true}
        currentName="Test"
        onRename={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <RenameModal
        isOpen={false}
        currentName="Test"
        onRename={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(document.body.style.overflow).toBe('unset');

    // Restore
    document.body.style.overflow = originalOverflow;
  });
});

describe('RenameModal Component - Structure', () => {
  test('has proper modal structure', () => {
    const { container } = render(
      <RenameModal
        isOpen={true}
        currentName="Test"
        onRename={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(container.querySelector('.rename-modal-backdrop')).toBeInTheDocument();
    expect(container.querySelector('.rename-modal')).toBeInTheDocument();
    expect(container.querySelector('.rename-modal-header')).toBeInTheDocument();
    expect(container.querySelector('.rename-modal-body')).toBeInTheDocument();
    expect(container.querySelector('.rename-modal-footer')).toBeInTheDocument();
  });

  test('input has proper label association', () => {
    render(
      <RenameModal
        isOpen={true}
        currentName="Test"
        onRename={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    const label = screen.getByText('Project Name');
    const input = screen.getByLabelText('Project Name');

    expect(label).toHaveAttribute('for', 'project-name');
    expect(input).toHaveAttribute('id', 'project-name');
  });

  test('Save button is a submit button', () => {
    render(
      <RenameModal
        isOpen={true}
        currentName="Test"
        onRename={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    const saveButton = screen.getByText('Save');
    expect(saveButton).toHaveAttribute('type', 'submit');
  });

  test('Cancel button is not a submit button', () => {
    render(
      <RenameModal
        isOpen={true}
        currentName="Test"
        onRename={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    expect(cancelButton).toHaveAttribute('type', 'button');
  });
});

describe('RenameModal Component - Edge Cases', () => {
  test('handles empty initial name', () => {
    render(
      <RenameModal
        isOpen={true}
        currentName=""
        onRename={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    const input = screen.getByLabelText('Project Name') as HTMLInputElement;
    expect(input.value).toBe('');
  });

  test('handles special characters in name', () => {
    const specialName = 'Project & <Test> "Name"';

    render(
      <RenameModal
        isOpen={true}
        currentName={specialName}
        onRename={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    const input = screen.getByLabelText('Project Name') as HTMLInputElement;
    expect(input.value).toBe(specialName);
  });

  test('handles very long initial name', () => {
    const longName = 'a'.repeat(255);

    render(
      <RenameModal
        isOpen={true}
        currentName={longName}
        onRename={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    const input = screen.getByLabelText('Project Name') as HTMLInputElement;
    expect(input.value).toBe(longName);
  });
});
