import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ConfirmDialog from './ConfirmDialog';

describe('ConfirmDialog Component - Basic Rendering', () => {
  test('does not render when isOpen is false', () => {
    render(
      <ConfirmDialog
        isOpen={false}
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.queryByText('Are you sure?')).not.toBeInTheDocument();
  });

  test('renders when isOpen is true', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  test('renders dialog with message', () => {
    const testMessage = 'This is a test confirmation message';

    render(
      <ConfirmDialog
        isOpen={true}
        message={testMessage}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.getByText(testMessage)).toBeInTheDocument();
  });

  test('renders default title when not provided', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        message="Test message"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
  });

  test('renders custom title when provided', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Delete Project"
        message="Test message"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.getByText('Delete Project')).toBeInTheDocument();
  });

  test('renders default button texts when not provided', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        message="Test message"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  test('renders custom button texts when provided', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        message="Test message"
        confirmText="Delete"
        cancelText="No, keep it"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('No, keep it')).toBeInTheDocument();
  });
});

describe('ConfirmDialog Component - Button Interaction', () => {
  test('calls onConfirm when Confirm button is clicked', () => {
    const mockOnConfirm = jest.fn();
    const mockOnCancel = jest.fn();

    render(
      <ConfirmDialog
        isOpen={true}
        message="Are you sure?"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  test('calls onCancel when Cancel button is clicked', () => {
    const mockOnConfirm = jest.fn();
    const mockOnCancel = jest.fn();

    render(
      <ConfirmDialog
        isOpen={true}
        message="Are you sure?"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  test('Confirm button is clickable', () => {
    const mockOnConfirm = jest.fn();

    render(
      <ConfirmDialog
        isOpen={true}
        message="Are you sure?"
        onConfirm={mockOnConfirm}
        onCancel={jest.fn()}
      />
    );

    const confirmButton = screen.getByText('Confirm');
    expect(confirmButton).not.toBeDisabled();
  });

  test('Cancel button is clickable', () => {
    const mockOnCancel = jest.fn();

    render(
      <ConfirmDialog
        isOpen={true}
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    expect(cancelButton).not.toBeDisabled();
  });
});

describe('ConfirmDialog Component - Backdrop Interaction', () => {
  test('calls onCancel when backdrop is clicked', () => {
    const mockOnCancel = jest.fn();

    const { container } = render(
      <ConfirmDialog
        isOpen={true}
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={mockOnCancel}
      />
    );

    const backdrop = container.querySelector('.confirm-dialog-backdrop');
    expect(backdrop).toBeInTheDocument();

    fireEvent.click(backdrop!);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  test('does not call onCancel when clicking inside dialog content', () => {
    const mockOnCancel = jest.fn();

    const { container } = render(
      <ConfirmDialog
        isOpen={true}
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={mockOnCancel}
      />
    );

    const dialog = container.querySelector('.confirm-dialog');
    expect(dialog).toBeInTheDocument();

    fireEvent.click(dialog!);

    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  test('backdrop exists when dialog is open', () => {
    const { container } = render(
      <ConfirmDialog
        isOpen={true}
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    const backdrop = container.querySelector('.confirm-dialog-backdrop');
    expect(backdrop).toBeInTheDocument();
  });
});

describe('ConfirmDialog Component - Escape Key Behavior', () => {
  test('calls onCancel when Escape key is pressed', () => {
    const mockOnCancel = jest.fn();

    render(
      <ConfirmDialog
        isOpen={true}
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  test('does not call onCancel for other keys', () => {
    const mockOnCancel = jest.fn();

    render(
      <ConfirmDialog
        isOpen={true}
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.keyDown(document, { key: 'Enter' });
    fireEvent.keyDown(document, { key: 'Space' });
    fireEvent.keyDown(document, { key: 'Tab' });

    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  test('does not trigger onCancel when dialog is closed', () => {
    const mockOnCancel = jest.fn();

    render(
      <ConfirmDialog
        isOpen={false}
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockOnCancel).not.toHaveBeenCalled();
  });
});

describe('ConfirmDialog Component - Body Scroll Management', () => {
  test('prevents body scroll when dialog is open', () => {
    const originalOverflow = document.body.style.overflow;

    render(
      <ConfirmDialog
        isOpen={true}
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(document.body.style.overflow).toBe('hidden');

    // Restore original value
    document.body.style.overflow = originalOverflow;
  });

  test('restores body scroll when dialog is closed', () => {
    const originalOverflow = document.body.style.overflow;

    const { rerender } = render(
      <ConfirmDialog
        isOpen={true}
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <ConfirmDialog
        isOpen={false}
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(document.body.style.overflow).toBe('unset');

    // Restore original value
    document.body.style.overflow = originalOverflow;
  });

  test('restores body scroll when component unmounts', () => {
    const originalOverflow = document.body.style.overflow;

    const { unmount } = render(
      <ConfirmDialog
        isOpen={true}
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(document.body.style.overflow).toBe('hidden');

    unmount();

    expect(document.body.style.overflow).toBe('unset');

    // Restore original value
    document.body.style.overflow = originalOverflow;
  });
});

describe('ConfirmDialog Component - Styling Variants', () => {
  test('applies default primary variant to confirm button', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    const confirmButton = screen.getByText('Confirm');
    expect(confirmButton).toHaveClass('confirm-dialog-btn-primary');
  });

  test('applies danger variant to confirm button when specified', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        message="Are you sure?"
        confirmVariant="danger"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    const confirmButton = screen.getByText('Confirm');
    expect(confirmButton).toHaveClass('confirm-dialog-btn-danger');
  });

  test('cancel button always has cancel class', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    expect(cancelButton).toHaveClass('confirm-dialog-btn-cancel');
  });
});

describe('ConfirmDialog Component - Structure', () => {
  test('has proper dialog structure', () => {
    const { container } = render(
      <ConfirmDialog
        isOpen={true}
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(container.querySelector('.confirm-dialog-backdrop')).toBeInTheDocument();
    expect(container.querySelector('.confirm-dialog')).toBeInTheDocument();
    expect(container.querySelector('.confirm-dialog-header')).toBeInTheDocument();
    expect(container.querySelector('.confirm-dialog-body')).toBeInTheDocument();
    expect(container.querySelector('.confirm-dialog-footer')).toBeInTheDocument();
  });

  test('title is in header', () => {
    const { container } = render(
      <ConfirmDialog
        isOpen={true}
        title="Test Title"
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    const header = container.querySelector('.confirm-dialog-header');
    const title = header?.querySelector('.confirm-dialog-title');
    expect(title?.textContent).toBe('Test Title');
  });

  test('message is in body', () => {
    const { container } = render(
      <ConfirmDialog
        isOpen={true}
        message="Test message content"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    const body = container.querySelector('.confirm-dialog-body');
    const message = body?.querySelector('.confirm-dialog-message');
    expect(message?.textContent).toBe('Test message content');
  });

  test('buttons are in footer', () => {
    const { container } = render(
      <ConfirmDialog
        isOpen={true}
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    const footer = container.querySelector('.confirm-dialog-footer');
    const buttons = footer?.querySelectorAll('.confirm-dialog-btn');
    expect(buttons?.length).toBe(2);
  });
});

describe('ConfirmDialog Component - Edge Cases', () => {
  test('handles very long messages', () => {
    const longMessage = 'This is a very long message that should still display correctly and not break the layout of the confirmation dialog component even with excessive text content';

    render(
      <ConfirmDialog
        isOpen={true}
        message={longMessage}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });

  test('handles special characters in message', () => {
    const messageWithSpecialChars = 'Delete "Project Name" with <special> & characters?';

    render(
      <ConfirmDialog
        isOpen={true}
        message={messageWithSpecialChars}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.getByText(messageWithSpecialChars)).toBeInTheDocument();
  });

  test('handles multiline messages', () => {
    const multilineMessage = 'Line 1\nLine 2\nLine 3';

    const { container } = render(
      <ConfirmDialog
        isOpen={true}
        message={multilineMessage}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    const messageElement = container.querySelector('.confirm-dialog-message');
    expect(messageElement).toBeInTheDocument();
    expect(messageElement?.textContent).toBe(multilineMessage);
  });

  test('handles empty message', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        message=""
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    const { container } = render(
      <ConfirmDialog
        isOpen={true}
        message=""
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(container.querySelector('.confirm-dialog-message')).toBeInTheDocument();
  });
});

describe('ConfirmDialog Component - Event Listener Cleanup', () => {
  test('removes event listeners when component unmounts', () => {
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

    const { unmount } = render(
      <ConfirmDialog
        isOpen={true}
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalled();

    removeEventListenerSpy.mockRestore();
  });

  test('cleans up event listeners when dialog closes', () => {
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

    const { rerender } = render(
      <ConfirmDialog
        isOpen={true}
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    const callCountAfterOpen = removeEventListenerSpy.mock.calls.length;

    rerender(
      <ConfirmDialog
        isOpen={false}
        message="Are you sure?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(removeEventListenerSpy.mock.calls.length).toBeGreaterThan(callCountAfterOpen);

    removeEventListenerSpy.mockRestore();
  });
});
